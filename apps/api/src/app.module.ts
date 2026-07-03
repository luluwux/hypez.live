// Root application module: registers all feature modules and wires global JWT guard
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler.guard.js';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';

import { IngestionModule } from './modules/ingestion/ingestion.module.js';
import { StatsModule } from './modules/stats/stats.module.js';
import { VOTE_COOLDOWN_MS } from './common/constants/index.js';
import { ServersModule } from './modules/servers/servers.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { VerificationModule } from './modules/verification/verification.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { VoteModule } from './modules/votes/vote.module.js';
import { HypeModule } from './modules/hype/hype.module.js';
import { RedisCacheModule } from './common/services/redis-cache.module.js';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { EventsModule } from './events/events.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),

        ScheduleModule.forRoot(),

        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 50,
            },
            {
                name: 'medium',
                ttl: 60000,
                limit: 500,
            },
            {
                name: 'long',
                ttl: 3600000,
                limit: 5000,
            },
            {
                name: 'vote',
                ttl: VOTE_COOLDOWN_MS,
                limit: 1,
            },
        ]),

        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.getOrThrow<string>('REDIS_URL');
                const isTlsUrl = redisUrl.startsWith('rediss://');
                return {
                    connection: {
                        url: redisUrl,
                        ...(isTlsUrl ? { tls: { rejectUnauthorized: false } } : {}),
                        keepAlive: 10000,
                        family: 0,
                    },
                };
            },
            inject: [ConfigService],
        }),

        RedisCacheModule,
        EventsModule,
        AuthModule,
        VoteModule,
        HypeModule,
        HealthModule,
        IngestionModule,
        StatsModule,
        ServersModule,
        VerificationModule,
        AdminModule,
        UsersModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: CustomThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}