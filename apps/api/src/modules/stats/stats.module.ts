import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StatsProcessor } from './stats.processor';
import { StatsService } from './stats.service';
import { StatsResetCron } from './stats-reset.cron';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'ingestion',
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
    ],
    providers: [StatsProcessor, StatsService, StatsResetCron, PrismaService],
    exports: [StatsService],
})
export class StatsModule { }
