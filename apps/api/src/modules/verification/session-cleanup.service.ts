import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service';

/**
 * VerificationSession tablosunu düzenli aralıklarla temizler.
 *
 * EXPIRED ve süresi dolmuş PENDING session'ların birikmesi tablo şişmesine
 * yol açar. Bu servis her gece 03:00'da (UTC) 24 saatten eski tüm
 * işlenmiş session'ları siler.
 */
@Injectable()
export class SessionCleanupService {
    private readonly logger = new Logger(SessionCleanupService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** Her gece 03:00 UTC'de çalışır */
    @Cron('0 3 * * *')
    async cleanupExpiredSessions(): Promise<void> {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 saat önce

        try {
            const { count } = await this.prisma.verificationSession.deleteMany({
                where: {
                    OR: [
                        // Süresi dolmuş her türlü session
                        { status: 'EXPIRED' },
                        // 24 saatten önce oluşmuş PENDING session'lar (kullanıcı cevap vermedi)
                        {
                            status: 'PENDING',
                            createdAt: { lte: cutoff },
                        },
                        // Başarıyla tamamlanmış session'lar 24 saatten eskiyse kaldır
                        {
                            status: 'VERIFIED',
                            createdAt: { lte: cutoff },
                        },
                    ],
                },
            });

            if (count > 0) {
                this.logger.log(`[Cleanup] Deleted ${count} expired verification sessions.`);
            }
        } catch (err) {
            this.logger.error('[Cleanup] Failed to clean verification sessions:', err);
        }
    }

    /** Her saat başında çalışır, süresi dolmuş premium sunucuları temizler */
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredPremiums(): Promise<void> {
        const now = new Date();
        try {
            const { count } = await this.prisma.server.updateMany({
                where: {
                    isPremium: true,
                    premiumExpiresAt: { lte: now },
                },
                data: {
                    isPremium: false,
                    premiumTier: 'NONE',
                    premiumExpiresAt: null,
                },
            });

            if (count > 0) {
                this.logger.log(`[Cleanup] Expired premium status for ${count} servers.`);
            }
        } catch (err) {
            this.logger.error('[Cleanup] Failed to clean expired premiums:', err);
        }
    }
}
