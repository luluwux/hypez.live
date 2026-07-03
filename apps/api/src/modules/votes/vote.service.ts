// Vote creation with cooldown enforcement inside a single transaction.
// Prevents race conditions where two concurrent requests both pass the cooldown check.
import {
    Injectable,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';
import { VOTE_COOLDOWN_MS } from '../../common/constants/index.js';
import { Prisma } from '@prisma/client';

export interface VoteResult {
    success: boolean;
    server: { id: string; name: string; votes: number };
    nextVoteAvailable: Date;
    resolvedUserId?: string;
}

@Injectable()
export class VoteService {
    private readonly logger = new Logger(VoteService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisCacheService,
    ) {
    }

    private async resolveUserIdWithoutTx(userIdOrDiscordId: string): Promise<string> {
        const cacheKey = `user:discord-to-cuid:${userIdOrDiscordId}`;
        const cachedCuid = await this.cache.get<string>(cacheKey);
        if (cachedCuid) {
            return cachedCuid;
        }

        const account = await this.prisma.account.findFirst({
            where: {
                provider: 'discord',
                providerAccountId: userIdOrDiscordId,
            },
            select: { userId: true },
        });

        if (account) {
            await this.cache.set(cacheKey, account.userId, 24 * 60 * 60 * 1000);
            return account.userId;
        }

        const directUser = await this.prisma.user.findUnique({
            where: { id: userIdOrDiscordId },
            select: { id: true },
        });
        if (directUser) {
            await this.cache.set(cacheKey, directUser.id, 24 * 60 * 60 * 1000);
            return directUser.id;
        }

        return userIdOrDiscordId;
    }

    private async resolveUserId(tx: Prisma.TransactionClient, userIdOrDiscordId: string): Promise<string> {
        const cacheKey = `user:discord-to-cuid:${userIdOrDiscordId}`;
        const cachedCuid = await this.cache.get<string>(cacheKey);
        if (cachedCuid) {
            return cachedCuid;
        }

        // 1. Önce bu ID'nin Account tablosunda providerAccountId (Discord ID) olarak kayıtlı olup olmadığına bakalım (CUID'e çözmek için)
        const account = await tx.account.findFirst({
            where: {
                provider: 'discord',
                providerAccountId: userIdOrDiscordId,
            },
            select: { userId: true },
        });

        if (account) {
            await this.cache.set(cacheKey, account.userId, 24 * 60 * 60 * 1000);
            return account.userId;
        }

        // 2. Yoksa bu ID'nin doğrudan User tablosunda var olup olmadığını kontrol edelim
        const directUser = await tx.user.findUnique({
            where: { id: userIdOrDiscordId },
            select: { id: true },
        });
        if (directUser) {
            await this.cache.set(cacheKey, directUser.id, 24 * 60 * 60 * 1000);
            return directUser.id;
        }

        // 3. Geçerli Discord snowflake formatı ise ghost user oluştur (17–20 haneli sayısal)
        const isValidSnowflake = /^\d{17,20}$/.test(userIdOrDiscordId);
        if (!isValidSnowflake) {
            this.logger.warn(`resolveUserId: rejecting non-snowflake userId="${userIdOrDiscordId}"`);
            return userIdOrDiscordId;
        }

        await tx.user.upsert({
            where: { id: userIdOrDiscordId },
            create: { id: userIdOrDiscordId },
            update: {},
        });
        await this.cache.set(cacheKey, userIdOrDiscordId, 24 * 60 * 60 * 1000);
        return userIdOrDiscordId;
    }

    async vote(serverId: string, userId: string, username?: string, avatarUrl?: string | null): Promise<VoteResult & { resolvedUserId: string }> {
        const cooldownMs = VOTE_COOLDOWN_MS;

        // 1. resolvedUserId'yi transaction dışında hızlıca çöz
        const resolvedUserId = await this.resolveUserIdWithoutTx(userId);

        // 2. Redis Cooldown Check
        const cooldownKey = `vote:cooldown:${resolvedUserId}:${serverId}`;
        const cachedCooldown = await this.cache.get<string>(cooldownKey);
        if (cachedCooldown) {
            const nextVoteTime = new Date(cachedCooldown);
            const hoursRemaining = Math.ceil(
                (nextVoteTime.getTime() - Date.now()) / (1000 * 60 * 60),
            );
            throw new ConflictException(
                `Vote cooldown active. Next vote available in ${hoursRemaining} hour(s) at ${nextVoteTime.toISOString()}`,
            );
        }

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const server = await tx.server.findUnique({
                    where: { id: serverId },
                    select: { id: true, ownerId: true },
                });

                if (!server) {
                    throw new NotFoundException(`Server with ID ${serverId} not found`);
                }

                const finalUserId = await this.resolveUserId(tx, userId);

                const cooldownTime = new Date(Date.now() - cooldownMs);

                // Double check cooldown in DB (prevent race conditions)
                const recentVote = await tx.vote.findFirst({
                    where: {
                        userId: finalUserId,
                        guildId: serverId,
                        createdAt: { gte: cooldownTime },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                if (recentVote) {
                    const nextVoteTime = new Date(recentVote.createdAt.getTime() + cooldownMs);
                    const hoursRemaining = Math.ceil(
                        (nextVoteTime.getTime() - Date.now()) / (1000 * 60 * 60),
                    );
                    throw new ConflictException(
                        `Vote cooldown active. Next vote available in ${hoursRemaining} hour(s) at ${nextVoteTime.toISOString()}`,
                    );
                }

                // If ghost user, sync username & avatar from bot (safety refresh)
                const isGhost = finalUserId === userId;
                if (isGhost && username) {
                    await tx.user.update({
                        where: { id: finalUserId },
                        data: {
                            name: username,
                            image: avatarUrl || null,
                        },
                    });
                }

                const updatedServer = await tx.server.update({
                    where: { id: serverId },
                    data: {
                        votes: { increment: 1 },
                        lastVoterId: finalUserId,
                        lastVotedAt: new Date(),
                    },
                    select: { id: true, name: true, votes: true },
                });

                const user = await tx.user.findUnique({
                    where: { id: finalUserId },
                    select: { name: true, image: true },
                });

                await tx.vote.create({
                    data: {
                        userId: finalUserId,
                        guildId: serverId,
                        cachedUsername: username ?? user?.name ?? null,
                        cachedAvatar: avatarUrl ?? user?.image ?? null,
                    },
                });

                const nextVoteAvailable = new Date(Date.now() + cooldownMs);

                return {
                    success: true,
                    server: updatedServer,
                    nextVoteAvailable,
                    resolvedUserId: finalUserId,
                };
            });

            // Transaction successful -> Set Redis Cooldown Key
            const nextVoteTimeStr = result.nextVoteAvailable.toISOString();
            await this.cache.set(cooldownKey, nextVoteTimeStr, cooldownMs);

            return result;
        } catch (error) {
            if (error instanceof ConflictException || error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`vote() failed — serverId=${serverId} userId=${userId}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
}
