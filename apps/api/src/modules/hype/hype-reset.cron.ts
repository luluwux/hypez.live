import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HypeService } from './hype.service.js';

@Injectable()
export class HypeResetCron {
    private readonly logger = new Logger(HypeResetCron.name);

    constructor(private readonly hypeService: HypeService) {}

    /** Her Pazartesi 00:00 UTC - Haftalık Hype skorlarını sıfırla */
    @Cron('0 0 * * 1', { timeZone: 'UTC' })
    async handleWeeklyReset(): Promise<void> {
        this.logger.log('[Hype] Weekly reset triggered — zeroing weeklyHypeScore for all servers...');
        try {
            await this.hypeService.resetWeeklyScores();
            this.logger.log('[Hype] Weekly reset complete.');
        } catch (err) {
            this.logger.error('[Hype] Weekly reset failed:', err);
        }
    }
}
