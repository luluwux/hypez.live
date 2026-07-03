import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service.js';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';
import { PremiumTier } from '@prisma/client';

@Injectable()
export class PremiumExpiryCron {
    private readonly logger = new Logger(PremiumExpiryCron.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisCacheService,
    ) {}

    /** Her saat başı çalışır — süresi dolmuş premium üyelikleri NONE'a düşürür */
    @Cron('0 * * * *', { timeZone: 'UTC' })
    async handlePremiumExpiry(): Promise<void> {
        this.logger.log('[Premium] Checking for expired premium servers...');

        try {
            const now = new Date();

            // Önce hangi server'ların expire olduğunu bul (cache invalidation için ID'lere ihtiyacımız var)
            const expiredServers = await this.prisma.server.findMany({
                where: {
                    isPremium: true,
                    premiumExpiresAt: { not: null, lte: now },
                },
                select: { id: true, name: true },
            });

            if (expiredServers.length === 0) {
                this.logger.log('[Premium] No expired premium servers found.');
                return;
            }

            const expiredIds = expiredServers.map((s) => s.id);

            // Hepsini tek sorguda NONE'a düşür
            const result = await this.prisma.server.updateMany({
                where: { id: { in: expiredIds } },
                data: {
                    isPremium: false,
                    premiumTier: PremiumTier.NONE,
                },
            });

            // Etkilenen sunucuların Redis cache'ini temizle
            await Promise.allSettled([
                ...expiredIds.map((id) => this.cache.del(`servers:detail:${id}`)),
                this.cache.delPattern('servers:list:*'),
            ]);

            const names = expiredServers.map((s) => `${s.name} (${s.id})`).join(', ');
            this.logger.log(`[Premium] Downgraded ${result.count} server(s): ${names}`);
        } catch (err) {
            this.logger.error('[Premium] Premium expiry check failed:', err);
        }
    }
}
