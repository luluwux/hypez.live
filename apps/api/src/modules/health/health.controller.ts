import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { LeaderboardService } from '../servers/leaderboard.service';
import { createLogger } from '../../common/utils/logger';

const logger = createLogger('HealthController');

interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database: {
            status: 'up' | 'down';
            responseTime?: number;
            error?: string;
        };
        redis: {
            status: 'up' | 'down' | 'not_configured';
            responseTime?: number;
            error?: string;
        };
        memory: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
            external: number;
        };
    };
}

@ApiTags('Health')
@Controller('health')
@Public()
@SkipThrottle()
export class HealthController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly leaderboard: LeaderboardService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({
        status: 200,
        description: 'All systems operational',
        schema: {
            example: {
                status: 'healthy',
                timestamp: '2026-01-16T14:22:00.000Z',
                uptime: 3600,
                checks: {
                    database: { status: 'up', responseTime: 5 },
                    redis: { status: 'up', responseTime: 2 },
                    memory: { heapUsed: 128, heapTotal: 256, rss: 512, external: 10 }
                }
            }
        }
    })
    @ApiResponse({
        status: 503,
        description: 'Service unavailable - critical dependency down'
    })
    async check(): Promise<HealthCheckResult> {
        const result: HealthCheckResult = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
                database: { status: 'down' },
                redis: { status: 'down' },
                memory: {
                    heapUsed: 0,
                    heapTotal: 0,
                    rss: 0,
                    external: 0,
                },
            },
        };

        let criticalFailure = false;

        // 1. Database Health Check
        try {
            const start = Date.now();
            await this.prisma.$queryRaw`SELECT 1`;
            const responseTime = Date.now() - start;

            result.checks.database = {
                status: 'up',
                responseTime,
            };

            logger.debug({ responseTime }, 'Database health check passed');
        } catch (error) {
            result.checks.database = {
                status: 'down',
                error: error.message,
            };
            criticalFailure = true;
            logger.error({ error: error.message }, 'Database health check failed');
        }

        // 2. Redis Health Check
        try {
            if (!this.leaderboard['redis'] || this.leaderboard['connectionFailed']) {
                result.checks.redis = {
                    status: 'not_configured',
                };
                logger.debug('Redis not configured or connection failed');
            } else {
                const start = Date.now();
                await this.leaderboard['redis'].ping();
                const responseTime = Date.now() - start;

                result.checks.redis = {
                    status: 'up',
                    responseTime,
                };

                logger.debug({ responseTime }, 'Redis health check passed');
            }
        } catch (error) {
            result.checks.redis = {
                status: 'down',
                error: error.message,
            };
            // Redis is not critical - we have DB fallback
            result.status = 'degraded';
            logger.warn({ error: error.message }, 'Redis health check failed');
        }

        // 3. Memory Usage Check
        try {
            const memUsage = process.memoryUsage();

            result.checks.memory = {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024), // MB
            };

            // Warn if memory usage is high (> 80% of heap)
            const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            if (heapUsagePercent > 80) {
                logger.warn({ heapUsagePercent: heapUsagePercent.toFixed(2) }, 'High memory usage detected');
                if (result.status === 'healthy') {
                    result.status = 'degraded';
                }
            }
        } catch (error) {
            logger.error({ error: error.message }, 'Memory check failed');
        }

        // Determine overall status
        if (criticalFailure) {
            result.status = 'unhealthy';
            throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
        }

        return result;
    }
}
