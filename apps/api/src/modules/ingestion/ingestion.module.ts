import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionController } from './ingestion.controller.js';
import { IngestionService } from './ingestion.service.js';

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
    controllers: [IngestionController],
    providers: [IngestionService],
    exports: [IngestionService],
})
export class IngestionModule { }
