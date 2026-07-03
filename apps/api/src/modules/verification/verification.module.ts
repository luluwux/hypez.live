import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { AnalyticsController } from './analytics.controller';
import { PrismaService } from '../../common/services/prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { MathCaptchaService } from './math-captcha.service';
import { CaptchaFactoryService } from './captcha-factory.service';
import { TrustScoreService } from './trust-score.service';
import { AnalyticsService } from './analytics.service';
import { SessionCleanupService } from './session-cleanup.service';
import { VoteModule } from '../votes/vote.module.js';
import { ServersModule } from '../servers/servers.module.js';

// VerificationService (DB-tabanlı eski akış) kaldırıldı.
// Aktif akış: CaptchaFactoryService (pool-tabanlı, worker thread).

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'leaderboard-update',
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 500,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        } as any),
        VoteModule,
        ServersModule,
    ],
    controllers: [VerificationController, AnalyticsController],
    providers: [
        PrismaService,
        MathCaptchaService,
        CaptchaFactoryService,
        TrustScoreService,
        AnalyticsService,
        SessionCleanupService,
    ],
    exports: [TrustScoreService, AnalyticsService],
})
export class VerificationModule { }
