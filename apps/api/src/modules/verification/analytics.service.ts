import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../common/services/prisma.service';
import { CaptchaTier } from './captcha-factory.service';

export interface AnalyticsMetrics {
    realTimeMetrics: {
        totalVotes: number;
        votesToday: number;
        tierDistribution: {
            [CaptchaTier.TRUSTED]: number;
            [CaptchaTier.NORMAL]: number;
            [CaptchaTier.CRITICAL]: number;
        };
        failedCaptchas: {
            [CaptchaTier.TRUSTED]: number;
            [CaptchaTier.NORMAL]: number;
            [CaptchaTier.CRITICAL]: number;
        };
    };
    aggregatedMetrics: {
        trustScoreDistribution: {
            trusted: number;
            normal: number;
            critical: number;
        };
        averageTrustScore: number;
        trustedUserGrowthRate: number;
    };
    dailyActivity: Array<{
        date: string;
        voteCount: number;
    }>;
    performanceMetrics: {
        avgTrustScoreCalculationTime: number;
        avgCaptchaGenerationTime: number;
    };
}

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(AnalyticsService.name);
    private redis: Redis | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        const redisUrl = this.configService.get<string>('REDIS_URL');

        if (!redisUrl) {
            this.logger.warn('REDIS_URL not configured, analytics will skip Redis metrics');
            return;
        }

        try {
            const safeUrl = redisUrl.replace('localhost', '127.0.0.1');
            const isTlsUrl = safeUrl.startsWith('rediss://');

            this.redis = new Redis(safeUrl, {
                maxRetriesPerRequest: null,
                enableOfflineQueue: true, // Allow commands to buffer when disconnected
                enableReadyCheck: false,
                keyPrefix: 'hypez:analytics:',
                retryStrategy: (times) => Math.min(times * 100, 5000),
                lazyConnect: true,
                family: 0,
                ...(isTlsUrl ? { tls: { rejectUnauthorized: false } } : {}),
            });

            this.redis.on('error', (err) => {
                this.logger.error(`Redis error: ${err.message}`);
            });

            this.redis.on('connect', () => {
                // this.logger.log('Redis connected for analytics');
            });

            this.redis.connect().catch(() => {
                this.logger.warn('Redis connection failed, analytics will use fallback');
            });

        } catch (error) {
            this.logger.warn('Redis initialization failed for analytics');
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
    async trackVote(tier: CaptchaTier) {
        if (!this.redis) return;

        try {
            await Promise.all([
                this.redis.incr('votes:total'),
                this.redis.incr(`tier:${tier}:count`),
                this.incrementTodayVotes(),
            ]);
            this.logger.log(`📊 Vote tracked: ${tier}`);
        } catch (error) {
            this.logger.error('Failed to track vote in Redis:', error);
        }
    }

    async trackFailedCaptcha(tier: CaptchaTier) {
        if (!this.redis) return;

        try {
            await this.redis.incr(`tier:${tier}:failed`);
            this.logger.log(`❌ Failed captcha tracked: ${tier}`);
        } catch (error) {
            this.logger.error('Failed to track failed captcha:', error);
        }
    }

    private async incrementTodayVotes() {
        if (!this.redis) return;

        const key = 'votes:today';
        await this.redis.incr(key);

        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
            await this.redis.expire(key, secondsUntilMidnight);
        }
    }

    async getRealTimeMetrics() {
        if (!this.redis) {
            return {
                totalVotes: 0,
                votesToday: 0,
                tierDistribution: {
                    [CaptchaTier.TRUSTED]: 0,
                    [CaptchaTier.NORMAL]: 0,
                    [CaptchaTier.CRITICAL]: 0,
                },
                failedCaptchas: {
                    [CaptchaTier.TRUSTED]: 0,
                    [CaptchaTier.NORMAL]: 0,
                    [CaptchaTier.CRITICAL]: 0,
                },
            };
        }

        const [
            totalVotes,
            votesToday,
            trustedCount,
            normalCount,
            criticalCount,
            trustedFailed,
            normalFailed,
            criticalFailed,
        ] = await Promise.all([
            this.redis.get('votes:total'),
            this.redis.get('votes:today'),
            this.redis.get(`tier:${CaptchaTier.TRUSTED}:count`),
            this.redis.get(`tier:${CaptchaTier.NORMAL}:count`),
            this.redis.get(`tier:${CaptchaTier.CRITICAL}:count`),
            this.redis.get(`tier:${CaptchaTier.TRUSTED}:failed`),
            this.redis.get(`tier:${CaptchaTier.NORMAL}:failed`),
            this.redis.get(`tier:${CaptchaTier.CRITICAL}:failed`),
        ]);

        return {
            totalVotes: parseInt(totalVotes || '0'),
            votesToday: parseInt(votesToday || '0'),
            tierDistribution: {
                [CaptchaTier.TRUSTED]: parseInt(trustedCount || '0'),
                [CaptchaTier.NORMAL]: parseInt(normalCount || '0'),
                [CaptchaTier.CRITICAL]: parseInt(criticalCount || '0'),
            },
            failedCaptchas: {
                [CaptchaTier.TRUSTED]: parseInt(trustedFailed || '0'),
                [CaptchaTier.NORMAL]: parseInt(normalFailed || '0'),
                [CaptchaTier.CRITICAL]: parseInt(criticalFailed || '0'),
            },
        };
    }
    async getTrustScoreDistribution(): Promise<{ trusted: number; normal: number; critical: number }> {
        const result = await this.prisma.$queryRaw<Array<{ bucket: string; count: bigint }>>`
            SELECT
                CASE
                    WHEN "trustScore" >= 70 THEN 'trusted'
                    WHEN "trustScore" >= 30 THEN 'normal'
                    ELSE 'critical'
                END AS bucket,
                COUNT(*)::integer AS count
            FROM "users"
            GROUP BY bucket
        `;

        const distribution = { trusted: 0, normal: 0, critical: 0 };
        for (const row of result) {
            if (row.bucket === 'trusted') distribution.trusted = Number(row.count);
            else if (row.bucket === 'normal') distribution.normal = Number(row.count);
            else distribution.critical += Number(row.count);
        }

        return distribution;
    }

    async getAverageTrustScore(): Promise<number> {
        const result = await this.prisma.user.aggregate({
            _avg: {
                trustScore: true,
            },
        });

        return result._avg.trustScore || 0;
    }

    async getTrustedUserGrowthRate(): Promise<number> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [currentTrusted, pastTrusted] = await Promise.all([
            this.prisma.user.count({
                where: { trustScore: { gte: 70 } },
            }),
            this.prisma.user.count({
                where: {
                    trustScore: { gte: 70 },
                    createdAt: { lte: sevenDaysAgo },
                },
            }),
        ]);

        if (pastTrusted === 0) return 0;
        return ((currentTrusted - pastTrusted) / pastTrusted) * 100;
    }

    async getDailyActivity(): Promise<Array<{ date: string; voteCount: number }>> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Gruplama SQL katmanında yapılır — uygulama katmanında N iterasyon yerine
        // veritabanı tek bir toplu sorguyla günlük sayımları döndürür.
        const rows = await this.prisma.$queryRaw<Array<{ date: string; vote_count: bigint }>>`
            SELECT
                DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')::date::text AS date,
                COUNT(*)::integer AS vote_count
            FROM "Vote"
            WHERE "createdAt" >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')
            ORDER BY date ASC
        `;

        const dailyMap = new Map<string, number>(
            rows.map(r => [r.date, Number(r.vote_count)]),
        );

        // Son 7 günlük diziyi sıralı olarak doldur; kayıt olmayan günler 0 döner
        const result: Array<{ date: string; voteCount: number }> = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setUTCHours(0, 0, 0, 0);
            date.setUTCDate(date.getUTCDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            result.push({ date: dateKey, voteCount: dailyMap.get(dateKey) ?? 0 });
        }

        return result;
    }
    async trackPerformance(metric: 'trustScore' | 'captcha', duration: number) {
        if (!this.redis) return;

        const key = `performance:${metric}`;
        try {
            await this.redis.lpush(key, duration.toString());
            await this.redis.ltrim(key, 0, 99);
        } catch (error) {
            this.logger.error(`Failed to track ${metric} performance:`, error);
        }
    }

    async getPerformanceMetrics() {
        if (!this.redis) {
            return {
                avgTrustScoreCalculationTime: 0,
                avgCaptchaGenerationTime: 0,
            };
        }

        const [trustScoreTimes, captchaTimes] = await Promise.all([
            this.redis.lrange('performance:trustScore', 0, -1),
            this.redis.lrange('performance:captcha', 0, -1),
        ]);

        const avgTrustScore = trustScoreTimes.length > 0
            ? trustScoreTimes.reduce((sum, t) => sum + parseFloat(t), 0) / trustScoreTimes.length
            : 0;

        const avgCaptcha = captchaTimes.length > 0
            ? captchaTimes.reduce((sum, t) => sum + parseFloat(t), 0) / captchaTimes.length
            : 0;

        return {
            avgTrustScoreCalculationTime: Math.round(avgTrustScore * 100) / 100,
            avgCaptchaGenerationTime: Math.round(avgCaptcha * 100) / 100,
        };
    }
    async getAnalytics(): Promise<AnalyticsMetrics> {
        const [
            realTimeMetrics,
            trustScoreDistribution,
            averageTrustScore,
            trustedUserGrowthRate,
            dailyActivity,
            performanceMetrics,
        ] = await Promise.all([
            this.getRealTimeMetrics(),
            this.getTrustScoreDistribution(),
            this.getAverageTrustScore(),
            this.getTrustedUserGrowthRate(),
            this.getDailyActivity(),
            this.getPerformanceMetrics(),
        ]);

        return {
            realTimeMetrics,
            aggregatedMetrics: {
                trustScoreDistribution,
                averageTrustScore: Math.round(averageTrustScore * 100) / 100,
                trustedUserGrowthRate: Math.round(trustedUserGrowthRate * 100) / 100,
            },
            dailyActivity,
            performanceMetrics,
        };
    }
}
