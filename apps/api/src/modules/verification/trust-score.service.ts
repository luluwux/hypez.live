import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class TrustScoreService {
    private readonly logger = new Logger(TrustScoreService.name);

    constructor(private prisma: PrismaService) { }

    async getScore(userId: string): Promise<{ score: number, isGuest: boolean }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, trustScore: true, emailVerified: true }
        });

        if (!user) {
            this.logger.log(`User ${userId} not found - treating as guest`);
            return { score: 0, isGuest: true };
        }

        // Return the stored trust score directly (Fresh Calculation logic updates this via other triggers)
        // If we still need to calculate dynamic parts, we keep them minimal.
        // Assuming 'Fresh Calculation' means we rely on the DB value which is updated by events.

        let score = user.trustScore;

        // Ensure bounds
        score = Math.min(Math.max(score, 0), 100);

        return { score, isGuest: false };
    }

    async updateScore(userId: string, change: number) {
        this.logger.log(`🔍 Attempting to update trust score for ${userId} by ${change > 0 ? '+' : ''}${change}`);

        // Check if user exists
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            this.logger.warn(`⚠️ User ${userId} not found in database. Cannot update trust score. User must login first via Discord OAuth.`);
            return;
        }

        let currentScore = user.trustScore || 0;
        let newScore = currentScore + change;

        // Clamp Score 0-100
        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;

        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { trustScore: newScore }
            });
            this.logger.log(`✅ Updated Trust Score for ${userId}: ${currentScore} → ${newScore} (${change > 0 ? '+' : ''}${change})`);
        } catch (error) {
            this.logger.error(`❌ Failed to update trust score for ${userId}:`, error);
            throw error;
        }
    }

    calculateInitialTrust(verifiedTimestamp: string | undefined): number {
        let score = 0;
        if (!verifiedTimestamp) return 0;

        const accountAge = Date.now() - parseInt(verifiedTimestamp);
        const oneYear = 365 * 24 * 60 * 60 * 1000;

        // Age > 1 Year = 50 Points
        if (accountAge > oneYear) score += 50;

        // This helper is rarely used now since Auth handles it, but good for consistency
        return score;
    }
}
