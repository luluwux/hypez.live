import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createLogger } from '../../common/utils/logger';

const logger = createLogger('LeaderboardService');

export enum LeaderboardType {
    VOICE = 'voice',
    MEMBERS = 'members',
    VOTES = 'votes',
}

@Injectable()
export class LeaderboardService implements OnModuleInit, OnModuleDestroy {
    private redis: Redis | null = null;
    private readonly keyPrefix = 'hypez:api:';
    private connectionFailed = false;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL');

        if (!redisUrl) {
            logger.warn('REDIS_URL not configured, leaderboard will use fallback');
            this.connectionFailed = true;
            return;
        }

        try {
            // Replace localhost with 127.0.0.1 if present to avoid Node v22 IPv6 issues
            const safeUrl = redisUrl.replace('localhost', '127.0.0.1');
            const isTlsUrl = safeUrl.startsWith('rediss://');

            this.redis = new Redis(safeUrl, {
                maxRetriesPerRequest: null, // Critical: Wait for reconnection instead of crashing
                enableOfflineQueue: false,
                enableReadyCheck: false,
                keyPrefix: 'hypez:api:',
                retryStrategy: (times) => {
                    return Math.min(times * 100, 5000); // 100ms, 200ms... max 5s
                },
                lazyConnect: true,
                ...(isTlsUrl ? { tls: { rejectUnauthorized: false } } : {}),
            });

            this.redis.on('error', (err) => {
                if ((err as { code?: string }).code === 'ECONNRESET') {
                    logger.warn('Redis connection reset, attempting to reconnect...');
                } else {
                    logger.error(`Redis connection error: ${err.message}`);
                }
                // Don't disable immediately, rely on retryStrategy
            });

            this.redis.on('connect', () => {
                // logger.info('Redis connected for leaderboard');
                this.connectionFailed = false;
            });

            // Let ioredis handle the connection in background
            // No manual .connect() or Promise.race blocking
            this.redis.connect().catch(() => {
                // Initial connection might fail, but retryStrategy will pick it up
                // We capture this to avoid unhandled promise rejection at startup
                logger.warn('Initial Redis connection failed, retrying in background...');
            });

        } catch (error) {
            logger.warn('Redis client initialization failed');
            this.connectionFailed = true;
            this.redis = null;
        }
    }

    async onModuleDestroy() {
        if (this.redis) {
            try {
                await this.redis.quit();
            } catch (error) {
                // Ignore
            }
        }
    }

    /**
     * Update server rank in leaderboard
     */
    async updateRank(type: LeaderboardType, serverId: string, score: number): Promise<void> {
        if (!this.redis) return;

        try {
            await this.redis.zadd(type, score, serverId);
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Update voice activity rank
     */
    async updateVoiceRank(serverId: string, voiceCount: number): Promise<void> {
        return this.updateRank(LeaderboardType.VOICE, serverId, voiceCount);
    }

    /**
     * Update member count rank
     */
    async updateMemberRank(serverId: string, memberCount: number): Promise<void> {
        return this.updateRank(LeaderboardType.MEMBERS, serverId, memberCount);
    }

    /**
     * Update vote rank
     */
    async updateVoteRank(serverId: string, votes: number): Promise<void> {
        return this.updateRank(LeaderboardType.VOTES, serverId, votes);
    }

    /**
     * Get top servers by type
     * @param type Leaderboard type
     * @param limit Number of servers to return (default 100)
     * @returns Array of server IDs in descending order
     */
    async getTop(type: LeaderboardType, limit: number = 100): Promise<string[]> {
        if (!this.redis) {
            return [];
        }

        try {
            const serverIds = await this.redis.zrevrange(type, 0, limit - 1);
            return serverIds;
        } catch (error) {
            return [];
        }
    }

    /**
     * Get top servers by voice activity
     */
    async getTopByVoice(limit: number = 100): Promise<string[]> {
        return this.getTop(LeaderboardType.VOICE, limit);
    }

    /**
     * Get top servers by member count
     */
    async getTopByMembers(limit: number = 100): Promise<string[]> {
        return this.getTop(LeaderboardType.MEMBERS, limit);
    }

    /**
     * Get top servers by votes
     */
    async getTopByVotes(limit: number = 100): Promise<string[]> {
        return this.getTop(LeaderboardType.VOTES, limit);
    }

    async getRank(type: LeaderboardType, serverId: string): Promise<{ rank: number; score: number } | null> {
        if (!this.redis) return null;

        try {
            const [rank, score] = await Promise.all([
                this.redis.zrevrank(type, serverId),
                this.redis.zscore(type, serverId),
            ]);

            if (rank === null || score === null) return null;

            return {
                rank: rank + 1,
                score: parseFloat(score),
            };
        } catch (error) {
            return null;
        }
    }
}
