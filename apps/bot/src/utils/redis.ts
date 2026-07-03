import Redis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');

class RedisClient {
    private client: Redis | null = null;
    private connectionFailed = false;

    async connect() {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            logger.warn('REDIS_URL not configured, leaderboard updates disabled');
            return;
        }

        if (this.connectionFailed) {
            return; // Don't retry if already failed
        }

        try {
            const safeUrl = redisUrl.replace('localhost', '127.0.0.1');
            const isTlsUrl = safeUrl.startsWith('rediss://');

            this.client = new Redis(safeUrl, {
                maxRetriesPerRequest: null, // Critical: Wait for reconnection
                enableReadyCheck: false,
                enableOfflineQueue: false, // Don't queue commands if offline
                keyPrefix: 'hypez:bot:',
                retryStrategy: (times) => {
                    return Math.min(times * 100, 5000); // 100ms... max 5s
                },
                lazyConnect: true,
                ...(isTlsUrl ? { tls: { rejectUnauthorized: false } } : {}),
            });

            this.client.on('error', (err) => {
                if ((err as { code?: string }).code === 'ECONNRESET') {
                    logger.warn('Redis connection reset, attempting to reconnect...');
                } else {
                    logger.error(`Redis connection error: ${err.message}`);
                }
            });

            this.client.on('connect', () => {
                logger.info('Redis connected for leaderboard updates');
                this.connectionFailed = false;
            });

            // Let ioredis handle connection in background
            this.client.connect().catch(() => {
                logger.warn('Initial Redis connection failed, retrying in background...');
            });

        } catch (error) {
            if (!this.connectionFailed) {
                logger.warn('Redis connection failed, leaderboard updates disabled');
            }
            this.connectionFailed = true;
            this.client = null;
        }
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.quit();
            } catch (error) {
                // Ignore disconnect errors
            }
        }
    }

    getRawClient(): Redis | null {
        return this.client;
    }

    /**
     * Update voice rank in leaderboard
     */
    async updateVoiceRank(guildId: string, voiceCount: number): Promise<void> {
        if (!this.client) return;

        try {
            await this.client.zadd('voice', voiceCount, guildId);
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Update member rank in leaderboard
     */
    async updateMemberRank(guildId: string, memberCount: number): Promise<void> {
        if (!this.client) return;

        try {
            await this.client.zadd('members', memberCount, guildId);
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Update vote rank in leaderboard
     */
    async updateVoteRank(guildId: string, votes: number): Promise<void> {
        if (!this.client) return;

        try {
            await this.client.zadd('votes', votes, guildId);
        } catch (error) {
            // Silent fail
        }
    }
}

export const redisClient = new RedisClient();
