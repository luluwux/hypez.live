import {
    Injectable,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';
import { EventsGateway } from '../../events/events.gateway.js';

function getWeekYear(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
    const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function calculateHypePoints(memberCount: number): number {
    const effectiveMemberCount = Math.max(memberCount, 25);
    return Math.round(100_000 / (Math.sqrt(effectiveMemberCount) + 1));
}

const MAX_WEEKLY_HYPES = 3;
const COOLDOWN_HOURS = 12;

export interface HypeResult {
    success: boolean;
    pointsAwarded: number;
    weeklyUsed: number;
    weeklyRemaining: number;
    nextHypeAvailableAt: Date | null;
}

export interface HypeStatus {
    weeklyUsed: number;
    weeklyRemaining: number;
    nextHypeAvailableAt: Date | null;
    lastHypeAt: Date | null;
}

@Injectable()
export class HypeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisCacheService,
        private readonly eventsGateway: EventsGateway,
    ) {}

    private async resolveUserId(tx: any, userIdOrDiscordId: string): Promise<string> {
        // 1. Önce bu ID'nin Account tablosunda providerAccountId (Discord ID) olarak kayıtlı olup olmadığına bakalım (CUID'e çözmek için)
        const account = await tx.account.findFirst({
            where: {
                provider: 'discord',
                providerAccountId: userIdOrDiscordId,
            },
            select: { userId: true },
        });

        if (account) {
            return account.userId;
        }

        // 2. Yoksa bu ID'nin doğrudan User tablosunda var olup olmadığını kontrol edelim
        const directUser = await tx.user.findUnique({
            where: { id: userIdOrDiscordId },
            select: { id: true },
        });
        if (directUser) {
            return directUser.id;
        }

        // 3. O da yoksa, bu ID'yi yeni bir User olarak oluşturalım
        await tx.user.upsert({
            where: { id: userIdOrDiscordId },
            create: { id: userIdOrDiscordId },
            update: {},
        });
        return userIdOrDiscordId;
    }

    async hype(serverId: string, userId: string): Promise<HypeResult> {
        const weekYear = getWeekYear();
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

        // All checks + writes inside a single transaction to prevent race conditions
        const txResult = await this.prisma.$transaction(async (tx) => {
            const server = await tx.server.findUnique({
                where: { id: serverId },
                select: { id: true, memberCount: true, ownerId: true },
            });

            if (!server) {
                throw new NotFoundException(`Server ${serverId} not found`);
            }

            const resolvedUserId = await this.resolveUserId(tx, userId);

            const weeklyVotes = await tx.hypeVote.findMany({
                where: { userId: resolvedUserId, weekYear },
                orderBy: { usedAt: 'desc' },
            });

            if (weeklyVotes.length >= MAX_WEEKLY_HYPES) {
                const nextReset = getNextMondayMidnight();
                throw new ConflictException(
                    `Weekly hype limit reached (${MAX_WEEKLY_HYPES}/${MAX_WEEKLY_HYPES}). Resets at ${nextReset.toISOString()}`,
                );
            }

            const lastHype = weeklyVotes[0];
            if (lastHype) {
                const nextAvailable = new Date(lastHype.usedAt.getTime() + cooldownMs);
                if (Date.now() < nextAvailable.getTime()) {
                    const hoursLeft = Math.ceil((nextAvailable.getTime() - Date.now()) / 3_600_000);
                    throw new ConflictException(
                        `Hype cooldown active. Next hype available in ${hoursLeft}h at ${nextAvailable.toISOString()}`,
                    );
                }
            }

            const pointsAwarded = calculateHypePoints(server.memberCount);

            await tx.hypeVote.create({
                data: { userId: resolvedUserId, serverId, weekYear },
            });

            const updatedServer = await tx.server.update({
                where: { id: serverId },
                data: {
                    weeklyHypeScore: { increment: pointsAwarded },
                    totalHypeScore: { increment: pointsAwarded },
                    totalHypes: { increment: 1 },
                },
            });

            // Anti-abuse check: if totalHypes / memberCount > 0.5, flag the server
            if (updatedServer.memberCount > 0) {
                const hypeRatio = (updatedServer.totalHypes ?? 0) / updatedServer.memberCount;
                if (hypeRatio > 0.5 && !updatedServer.isFlagged) {
                    await tx.server.update({
                        where: { id: serverId },
                        data: { isFlagged: true },
                    });
                    console.warn(`[Hype] Şüpheli sunucu işaretlendi: ${serverId} (Ratio: ${hypeRatio.toFixed(2)})`);
                }
            }

            return { pointsAwarded, previousCount: weeklyVotes.length, resolvedUserId };
        });

        await this.cache.delPattern('hype:top:*');

        const newWeeklyUsed = txResult.previousCount + 1;
        const remaining = MAX_WEEKLY_HYPES - newWeeklyUsed;
        const nextHypeAvailableAt = newWeeklyUsed >= MAX_WEEKLY_HYPES
            ? getNextMondayMidnight()
            : new Date(Date.now() + COOLDOWN_HOURS * 3_600_000);

        this.eventsGateway.emitHypeUpdate(serverId, {
            pointsAwarded: txResult.pointsAwarded,
            lastHyperId: txResult.resolvedUserId
        });

        return {
            success: true,
            pointsAwarded: txResult.pointsAwarded,
            weeklyUsed: newWeeklyUsed,
            weeklyRemaining: remaining,
            nextHypeAvailableAt,
        };
    }

    async getStatus(serverId: string, userId: string): Promise<HypeStatus> {
        const weekYear = getWeekYear();
        const resolvedUserId = await this.resolveUserId(this.prisma, userId);

        const weeklyVotes = await this.prisma.hypeVote.findMany({
            where: { userId: resolvedUserId, weekYear },
            orderBy: { usedAt: 'desc' },
        });

        const weeklyUsed = weeklyVotes.length;
        const weeklyRemaining = Math.max(0, MAX_WEEKLY_HYPES - weeklyUsed);
        const lastHype = weeklyVotes[0] ?? null;

        let nextHypeAvailableAt: Date | null = null;
        if (lastHype && weeklyRemaining > 0) {
            const cooldownMs = COOLDOWN_HOURS * 3_600_000;
            const candidate = new Date(lastHype.usedAt.getTime() + cooldownMs);
            nextHypeAvailableAt = candidate > new Date() ? candidate : null;
        } else if (weeklyUsed >= MAX_WEEKLY_HYPES) {
            nextHypeAvailableAt = getNextMondayMidnight();
        }

        return {
            weeklyUsed,
            weeklyRemaining,
            nextHypeAvailableAt,
            lastHypeAt: lastHype?.usedAt ?? null,
        };
    }

    async getTopServers(limit = 100) {
        const cacheKey = `hype:top:${limit}`;
        return this.cache.getOrSet(cacheKey, () => this.getTopServersUncached(limit), 300_000);
    }

    private async getTopServersUncached(limit: number) {
        return this.prisma.server.findMany({
            where: { isVisible: true },
            orderBy: [
                { weeklyHypeScore: 'desc' },
                { votes: 'desc' }
            ],
            take: limit,
            select: {
                id: true,
                name: true,
                icon: true,
                banner: true,
                memberCount: true,
                categories: true,
                weeklyHypeScore: true,
                totalHypeScore: true,
                premiumTier: true,
                inviteUrl: true,
            },
        });
    }

    async resetWeeklyScores(): Promise<void> {
        await this.prisma.server.updateMany({
            data: { weeklyHypeScore: 0 },
        });

        await this.cache.delPattern('hype:top:*');
    }
}

function getNextMondayMidnight(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilMonday = day === 1 ? 7 : (1 - day + 7) % 7;
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextMonday.setUTCHours(0, 0, 0, 0);
    return nextMonday;
}
