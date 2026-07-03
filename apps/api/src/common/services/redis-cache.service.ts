import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
    private redis: Redis | null = null;
    private readonly logger = new Logger(RedisCacheService.name);
    private readonly defaultTTL = 60_000;

    constructor(private readonly configService: ConfigService) {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        if (!redisUrl) {
            this.logger.warn('REDIS_URL not configured, cache disabled');
            return;
        }

        try {
            const safeUrl = redisUrl.replace('localhost', '127.0.0.1');
            const isTlsUrl = safeUrl.startsWith('rediss://');
            this.redis = new Redis(safeUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => Math.min(times * 200, 2000),
                lazyConnect: true,
                ...(isTlsUrl ? { tls: { rejectUnauthorized: false } } : {}),
            });

            this.redis.on('error', (err) => {
                this.logger.error(`Redis error: ${err.message}`);
            });

            this.redis.connect().catch(() => {
                this.logger.warn('Redis connection failed, cache disabled');
                this.redis = null;
            });
        } catch {
            this.logger.warn('Redis init failed, cache disabled');
            this.redis = null;
        }
    }

    async onModuleDestroy() {
        if (this.redis) {
            await this.redis.quit();
        }
    }

    private get client(): Redis | null {
        return this.redis;
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        if (!this.client) return null;
        try {
            const raw = await this.client.get(key);
            return raw ? (JSON.parse(raw) as T) : null;
        } catch {
            return null;
        }
    }

    async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
        if (!this.client) return;
        try {
            const serialized = JSON.stringify(value);
            const ttl = ttlMs ?? this.defaultTTL;
            await this.client.set(key, serialized, 'PX', ttl);
        } catch (err) {
            this.logger.error(`Cache set failed for ${key}:`, err);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.del(key);
        } catch (err) {
            this.logger.error(`Cache del failed for ${key}:`, err);
        }
    }

    /** Delete all keys matching a pattern (uses SCAN for non-blocking iteration) */
    async delPattern(pattern: string): Promise<void> {
        if (!this.client) return;
        try {
            let cursor = '0';
            do {
                const [nextCursor, keys] = await this.client.scan(
                    cursor,
                    'MATCH',
                    pattern,
                    'COUNT',
                    100,
                );
                cursor = nextCursor;
                if (keys.length > 0) {
                    await this.client.del(keys);
                }
            } while (cursor !== '0');
        } catch (err) {
            this.logger.error(`Cache delPattern failed for ${pattern}:`, err);
        }
    }

    /** getOrSet: fetch from cache, or compute + store + return */
    async getOrSet<T = unknown>(
        key: string,
        factory: () => Promise<T>,
        ttlMs?: number,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        await this.set(key, value, ttlMs);
        return value;
    }

    /** Async iterator version: each record is cached individually */
    async getOrSetEach<T extends { id: string }>(
        prefix: string,
        ids: string[],
        factory: (ids: string[]) => Promise<T[]>,
        ttlMs?: number,
    ): Promise<T[]> {
        if (!this.client || ids.length === 0) return factory(ids);

        const keys = ids.map((id) => `${prefix}:${id}`);
        const cached: (T | null)[] = [];

        try {
            const rawList = await this.client.mget(keys);
            for (const raw of rawList) {
                cached.push(raw ? (JSON.parse(raw) as T) : null);
            }
        } catch {
            return factory(ids);
        }

        const missingIds = ids.filter((_, i) => cached[i] === null);
        if (missingIds.length === 0) {
            return cached.filter((v): v is T => v !== null);
        }

        const fresh = await factory(missingIds);
        const freshMap = new Map(fresh.map((v) => [v.id, v]));

        const pipeline = this.client.pipeline();
        for (const id of missingIds) {
            const record = freshMap.get(id);
            if (record) {
                pipeline.set(`${prefix}:${id}`, JSON.stringify(record), 'PX', ttlMs ?? this.defaultTTL);
            }
        }
        pipeline.exec().catch(() => {});

        return ids.map((id) => cached.find((c) => c?.id === id) ?? freshMap.get(id)).filter((v): v is T => v !== null);
    }
}
