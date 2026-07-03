import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class StatsResetCron {
    private readonly logger = new Logger(StatsResetCron.name);

    constructor(private readonly prisma: PrismaService) {}

    // Her pazar gece yarısı (Pazartesiye bağlayan gece) çalışır
    @Cron('0 0 * * 1', { timeZone: 'UTC' })
    async handleCron() {
        this.logger.log('Haftalık ses ve mesaj istatistikleri sıfırlanıyor...');
        
        try {
            const result = await this.prisma.server.updateMany({
                data: {
                    weeklyVoiceMinutes: 0,
                    weeklyMessageCount: 0,
                },
            });
            this.logger.log(`${result.count} sunucunun haftalık istatistikleri sıfırlandı.`);
        } catch (error) {
            this.logger.error('Haftalık istatistikleri sıfırlarken hata oluştu:', error);
        }
    }
}
