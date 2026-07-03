import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class IngestionService {
    private readonly logger = new Logger(IngestionService.name);

    constructor(@InjectQueue('ingestion') private ingestionQueue: Queue) { }

    async queueStats(data: { serverId: string; memberCount: number; activeMemberCount: number; voiceCount?: number; messageCount?: number }) {
        await this.ingestionQueue.add('process-stats', data, {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });

        this.logger.debug(`Queued stats for ${data.serverId}`);
    }
}
