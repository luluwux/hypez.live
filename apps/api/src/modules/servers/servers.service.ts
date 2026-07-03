// Core server CRUD service; voting is delegated to VoteService.
// All write operations route through this service — single source of truth.
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import { VoteService } from '../votes/vote.service.js';
import { LeaderboardService } from './leaderboard.service.js';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';
import { EventsGateway } from '../../events/events.gateway.js';
import { CreateServerDto } from './dto/create-server.dto.js';
import { UpdateServerDto } from './dto/update-server.dto.js';
import { UserUpdateServerDto } from './dto/user-update-server.dto.js';
import { FindServersDto } from './dto/find-servers.dto.js';
import { SyncServerDto, BatchCounterDto } from './dto/sync-server.dto.js';
import type { PaginatedResponse } from '@hypez/shared-types';
import { ServerSortField } from '@hypez/shared-types';
import { Prisma, PremiumTier } from '@prisma/client';
import { ConfigService } from '@nestjs/config';



/** Maps SyncServerDto (minus emoji/sticker arrays) to Prisma.ServerCreateInput.
 *  The bot always sends ownerId at runtime even though it's optional in the DTO. */
function toServerCreateInput(serverData: Omit<SyncServerDto, 'emojis' | 'stickers'>): Prisma.ServerCreateInput {
    return {
        id: serverData.id,
        name: serverData.name,
        ownerId: serverData.ownerId ?? '',
        description: serverData.description ?? null,
        icon: serverData.icon ?? null,
        banner: serverData.banner ?? null,
        memberCount: serverData.memberCount ?? 0,
        activeMemberCount: serverData.activeMemberCount ?? 0,
        channelCount: serverData.channelCount ?? 0,
        roleCount: serverData.roleCount ?? 0,
        emojiCount: serverData.emojiCount ?? 0,
        stickerCount: serverData.stickerCount ?? 0,
        boostCount: serverData.boostCount ?? 0,
        voiceMemberCount: serverData.voiceMemberCount ?? 0,
        streamingMemberCount: serverData.streamingMemberCount ?? 0,
        videoMemberCount: serverData.videoMemberCount ?? 0,
        normalVoiceMemberCount: serverData.normalVoiceMemberCount ?? 0,
        voiceChannelCount: serverData.voiceChannelCount ?? 0,
        inviteUrl: serverData.inviteUrl ?? null,
        badges: serverData.badges ?? [],
        locale: serverData.locale ?? 'en',
        categories: serverData.categories ?? [],
    };
}

function toServerUpdateInput(serverData: Omit<SyncServerDto, 'emojis' | 'stickers'>): Prisma.ServerUpdateInput {
    return {
        name: serverData.name,
        ownerId: serverData.ownerId,
        description: serverData.description ?? null,
        icon: serverData.icon ?? null,
        banner: serverData.banner ?? null,
        memberCount: serverData.memberCount,
        activeMemberCount: serverData.activeMemberCount,
        channelCount: serverData.channelCount,
        voiceChannelCount: serverData.voiceChannelCount,
        roleCount: serverData.roleCount,
        emojiCount: serverData.emojiCount,
        stickerCount: serverData.stickerCount,
        boostCount: serverData.boostCount,
        voiceMemberCount: serverData.voiceMemberCount,
        streamingMemberCount: serverData.streamingMemberCount,
        videoMemberCount: serverData.videoMemberCount,
        normalVoiceMemberCount: serverData.normalVoiceMemberCount,
        // Only overwrite inviteUrl when the payload explicitly includes it (null = clear, undefined = preserve)
        ...(serverData.inviteUrl !== undefined ? { inviteUrl: serverData.inviteUrl } : {}),
        badges: serverData.badges ?? [],
        locale: serverData.locale ?? 'en',
        categories: serverData.categories ?? [],
        version: { increment: 1 },
    };
}

// Shared select shape for list endpoints (no heavy relations)
const SERVER_SUMMARY_SELECT = {
    id: true,
    name: true,
    description: true,
    icon: true,
    banner: true,
    memberCount: true,
    activeMemberCount: true,
    votes: true,
    categories: true,
    premiumTier: true,
    isPremium: true,
    channelCount: true,
    roleCount: true,
    emojiCount: true,
    stickerCount: true,
    boostCount: true,
    voiceMemberCount: true,
    streamingMemberCount: true,
    videoMemberCount: true,
    normalVoiceMemberCount: true,
    weeklyVoiceMinutes: true,
    weeklyMessageCount: true,
    createdAt: true,
    locale: true,
    inviteUrl: true,
    weeklyHypeScore: true,
    totalHypeScore: true,
    isBlacklisted: true,
    blacklistReason: true,
} as const;

type ServerSummary = Prisma.ServerGetPayload<{ select: typeof SERVER_SUMMARY_SELECT }>;

@Injectable()
export class ServersService {
    private readonly logger = new Logger(ServersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly voteService: VoteService,
        private readonly leaderboard: LeaderboardService,
        private readonly cache: RedisCacheService,
        private readonly eventsGateway: EventsGateway,
        private readonly config: ConfigService,
    ) {}


    private cacheListKey(dto: FindServersDto): string {
        const parts = [
            dto.page, dto.limit, dto.sort ?? 'default',
            dto.category ?? '',
            dto.search ?? '', dto.isPremium ?? '',
            dto.language ?? '', dto.nsfw ?? '0',
            dto.ignorePremiumBoost ? '1' : '0',
        ];
        return `servers:list:${parts.join(':')}`;
    }

    private cacheDetailKey(id: string): string {
        return `servers:detail:${id}`;
    }

    private async invalidateList(): Promise<void> {
        await this.cache.delPattern('servers:list:*');
    }

    private async invalidateServer(id: string): Promise<void> {
        await Promise.all([
            this.cache.del(this.cacheDetailKey(id)),
            this.invalidateList(),
        ]);
    }

    async create(createServerDto: CreateServerDto, requestingDiscordId: string) {
        const { category, id, ...rest } = createServerDto;
        // Override ownerId with the authenticated user's Discord ID — prevents spoofing
        const data = { ...rest, ownerId: requestingDiscordId, categories: category ? [category] : [] };

        let result;
        if (id) {
            result = await this.prisma.server.upsert({
                where: { id },
                create: { id, ...data },
                update: data,
            });
        } else {
            result = await this.prisma.server.create({ data });
        }

        await this.invalidateList();
        if (id) await this.cache.del(this.cacheDetailKey(id));
        return result;
    }

    async syncBatch(servers: CreateServerDto[]) {
        const result = await this.prisma.$transaction(
            servers.map((server) => {
                const { category, id, ...rest } = server;
                const data = { ...rest, categories: category ? [category] : [] };

                if (!id) throw new Error('Server ID is required for sync');

                return this.prisma.server.upsert({
                    where: { id },
                    create: { id, ...data },
                    update: data,
                });
            }),
        );

        await this.invalidateList();
        for (const s of servers) {
            if (s.id) await this.cache.del(this.cacheDetailKey(s.id));
        }
        return result;
    }

    /** Full server sync from bot — upserts server metadata, emojis, and stickers atomically */
    async syncServerFull(dto: SyncServerDto) {
        const { emojis, stickers, ...serverData } = dto;

        const result = await this.prisma.$transaction(async (tx) => {
            const existingServer = await tx.server.findUnique({
                where: { id: dto.id },
                select: { inviteUrl: true },
            });

            const updateInput = toServerUpdateInput(serverData);
            if (existingServer?.inviteUrl && serverData.inviteUrl !== undefined) {
                delete updateInput.inviteUrl;
            }

            await tx.server.upsert({
                where: { id: dto.id },
                create: toServerCreateInput(serverData),
                update: updateInput,
            });

            if (emojis !== undefined) {
                await tx.serverEmoji.deleteMany({ where: { serverId: dto.id } });
                if (emojis.length > 0) {
                    await tx.serverEmoji.createMany({
                        data: emojis.map((e) => ({ ...e, serverId: dto.id })),
                        skipDuplicates: true,
                    });
                }
            }

            if (stickers !== undefined) {
                await tx.serverSticker.deleteMany({ where: { serverId: dto.id } });
                if (stickers.length > 0) {
                    await tx.serverSticker.createMany({
                        data: stickers.map((s) => ({ ...s, serverId: dto.id })),
                        skipDuplicates: true,
                    });
                }
            }

            return { id: dto.id };
        }, {
            timeout: 30000, // 30 seconds to allow large batches with emojis/stickers
        });

        await this.invalidateServer(dto.id);
        return result;
    }

    /** Batch sync with full payload — each server runs in its own transaction (parallel, no lock contention) */
    async syncBatchFull(dtos: SyncServerDto[]) {
        await Promise.all(dtos.map((dto) => this.syncServerFull(dto)));
        await this.invalidateList();
        return { count: dtos.length };
    }

    /** Idempotent server deletion — OK if already gone */
    async removeServer(id: string): Promise<void> {
        await this.prisma.server.delete({ where: { id } }).catch((err) => {
            const code = (err as { code?: string }).code;
            // P2025 = record not found (idempotent), P2003 = FK constraint (cascade not yet applied)
            if (code === 'P2025' || code === 'P2003') {
                return;
            }
            throw err;
        });

        await this.invalidateServer(id);
    }

    /** Batch counter updates with optimistic locking */
    async batchUpdateCounters(updates: BatchCounterDto[]): Promise<{ count: number; failedIds: string[] }> {
        if (updates.length === 0) return { count: 0, failedIds: [] };

        const results = await this.prisma.$transaction(
            updates.map((u) => {
                const { serverId, version, updatedAt, ...counters } = u;
                const where: Prisma.ServerWhereInput = { id: serverId };
                if (version !== undefined) {
                    where.version = version;
                }

                return this.prisma.server.updateMany({
                    where,
                    data: {
                        ...counters,
                        ...(updatedAt !== undefined ? { updatedAt: new Date(updatedAt) } : {}),
                        version: { increment: 1 },
                    },
                });
            }),
        );

        // Identify failed (stale version) updates
        const failedIds: string[] = [];
        for (let i = 0; i < results.length; i++) {
            if (results[i].count === 0) {
                failedIds.push(updates[i].serverId);
            }
        }

        // Invalidate affected detail caches + list
        await this.invalidateList();
        for (const u of updates) {
            await this.cache.del(this.cacheDetailKey(u.serverId));
        }

        return { count: updates.length - failedIds.length, failedIds };
    }

    /** Sync emojis for a server (replace-all pattern, version-checked) */
    async syncEmojis(
        serverId: string,
        emojis: { emojiId: string; name: string; url: string; animated?: boolean }[],
    ) {
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.serverEmoji.deleteMany({ where: { serverId } });

            if (emojis.length > 0) {
                await tx.serverEmoji.createMany({
                    data: emojis.map((e) => ({ ...e, serverId })),
                    skipDuplicates: true,
                });
            }

            await tx.server.update({
                where: { id: serverId },
                data: { emojiCount: emojis.length, version: { increment: 1 } },
            });

            return { count: emojis.length };
        });

        await this.cache.del(this.cacheDetailKey(serverId));
        return result;
    }

    /** Sync stickers for a server (replace-all pattern, version-checked) */
    async syncStickers(
        serverId: string,
        stickers: { stickerId: string; name: string; url: string; format: string }[],
    ) {
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.serverSticker.deleteMany({ where: { serverId } });

            if (stickers.length > 0) {
                await tx.serverSticker.createMany({
                    data: stickers.map((s) => ({ ...s, serverId })),
                    skipDuplicates: true,
                });
            }

            await tx.server.update({
                where: { id: serverId },
                data: { stickerCount: stickers.length, version: { increment: 1 } },
            });

            return { count: stickers.length };
        });

        await this.cache.del(this.cacheDetailKey(serverId));
        return result;
    }

    private buildUpsertOp(dto: SyncServerDto) {
        const { emojis, stickers, ...serverData } = dto;

        return this.prisma.server.upsert({
            where: { id: dto.id },
            create: toServerCreateInput(serverData),
            update: toServerUpdateInput(serverData),
        });
    }

    async findAll(dto: FindServersDto): Promise<PaginatedResponse<ServerSummary>> {
        const cacheKey = this.cacheListKey(dto);
        return this.cache.getOrSet(cacheKey, () => this.findAllUncached(dto), 60_000);
    }

    private async findAllUncached(dto: FindServersDto): Promise<PaginatedResponse<ServerSummary>> {
        const skip = (dto.page - 1) * dto.limit;

        const where: Prisma.ServerWhereInput = { isVisible: true, isBlacklisted: false };

        // Flat category filter — matches any of the comma-separated values
        if (dto.category) {
            const cats = dto.category.split(',').map(c => c.trim()).filter(Boolean);
            if (cats.length > 0) {
                where.categories = { hasSome: cats };
            }
        }

        // NSFW gate: hide NSFW servers by default (both flag AND '18+' category)
        if (!dto.nsfw) {
            where.nsfw = false;
            where.NOT = { categories: { has: '18+' } };
        }

        if (dto.search) {
            where.name = { contains: dto.search, mode: 'insensitive' };
        }

        if (dto.isPremium !== undefined) {
            if (dto.isPremium) {
                where.premiumTier = PremiumTier.PREMIUM;
            } else {
                where.premiumTier = PremiumTier.NONE;
            }
        }

        if (dto.language) {
            where.locale = dto.language;
        }

        if (dto.sort === ServerSortField.RANDOM) {
            const total = await this.prisma.server.count({ where });
            const totalPages = Math.ceil(total / dto.limit);

            // Explicit column list mirrors SERVER_SUMMARY_SELECT — prevents leaking internal fields
            const selectCols = [
                '"id"', '"name"', '"description"', '"icon"', '"banner"',
                '"memberCount"', '"activeMemberCount"', '"votes"', '"categories"',
                '"premiumTier"', '"isPremium"', '"channelCount"', '"roleCount"',
                '"emojiCount"', '"stickerCount"', '"boostCount"', '"voiceMemberCount"',
                '"streamingMemberCount"', '"videoMemberCount"', '"normalVoiceMemberCount"',
                '"weeklyVoiceMinutes"', '"weeklyMessageCount"', '"createdAt"',
                '"locale"', '"inviteUrl"', '"weeklyHypeScore"', '"totalHypeScore"',
                '"isBlacklisted"', '"blacklistReason"',
            ].join(', ');

            const conditions: Prisma.Sql[] = [
                Prisma.sql`"isVisible" = true`,
                Prisma.sql`"isBlacklisted" = false`,
            ];

            if (dto.category) {
                const cats = dto.category.split(',').map(c => c.trim()).filter(Boolean);
                if (cats.length > 0) {
                    conditions.push(Prisma.sql`categories && ${cats}::text[]`);
                }
            }
            if (dto.nsfw === false || dto.nsfw === undefined) {
                conditions.push(Prisma.sql`"nsfw" = false`);
                conditions.push(Prisma.sql`NOT ('18+' = ANY(categories))`);
            }
            if (dto.language) {
                conditions.push(Prisma.sql`locale = ${dto.language}`);
            }

            const whereClause = Prisma.join(conditions, ' AND ');

            const rawServers = await this.prisma.$queryRaw<ServerSummary[]>(
                Prisma.sql`SELECT ${Prisma.raw(selectCols)} FROM "Server" WHERE ${whereClause} ORDER BY RANDOM() LIMIT ${dto.limit} OFFSET ${(dto.page - 1) * dto.limit}`,
            );

            return {
                data: rawServers,
                meta: { total, page: dto.page, limit: dto.limit, totalPages, hasNext: dto.page < totalPages, hasPrev: dto.page > 1 },
            };
        }

        const orderBy = this.buildOrderBy(dto.sort, dto.ignorePremiumBoost);

        const [servers, total] = await Promise.all([
            this.prisma.server.findMany({
                where,
                skip,
                take: dto.limit,
                orderBy,
                select: SERVER_SUMMARY_SELECT,
            }),
            this.prisma.server.count({ where }),
        ]);

        const totalPages = Math.ceil(total / dto.limit);

        return {
            data: servers,
            meta: {
                total,
                page: dto.page,
                limit: dto.limit,
                totalPages,
                hasNext: dto.page < totalPages,
                hasPrev: dto.page > 1,
            },
        };
    }

    async findOne(id: string, includeStats: boolean = false) {
        // Only cache non-stats lookups (stats are volatile)
        const cacheKey = this.cacheDetailKey(id);
        if (!includeStats) {
            return this.cache.getOrSet(cacheKey, () => this.findOneUncached(id, false), 30_000);
        }
        return this.findOneUncached(id, includeStats);
    }

    // Fetch discord user directly as fallback
    private async fetchDiscordUser(userId: string) {
        const token = this.config.get<string>('DISCORD_TOKEN');
        if (!token) return null;
        try {
            const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
                headers: { Authorization: `Bot ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                return {
                    name: data.global_name || data.username,
                    image: data.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${data.avatar}.png` : null
                };
            }
        } catch { /* ignore */ }
        return null;
    }

    private async findOneUncached(id: string, includeStats: boolean) {
        const server = await this.prisma.server.findUnique({
            where: { id },
            include: {
                emojis: { select: { id: true, emojiId: true, name: true, url: true, animated: true } },
                stickers: { select: { id: true, stickerId: true, name: true, url: true, format: true } },
                ...(includeStats && { stats: { orderBy: { recordedAt: 'desc' as const }, take: 5 } }),
            },
        });

        if (!server) {
            throw new NotFoundException(`Server with ID ${id} not found`);
        }

        const recentVotes = await this.prisma.vote.findMany({
            where: { guildId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        // Account tablosundan Discord bilgilerini de çek
                        accounts: {
                            where: { provider: 'discord' },
                            select: { providerAccountId: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const voteCountMap = new Map<string, { userId: string; username: string; avatarUrl: string | null; voteCount: number; fetchedDiscord?: boolean }>();
        for (const v of recentVotes) {
            const existing = voteCountMap.get(v.userId);
            if (existing) {
                existing.voteCount++;
            } else {
                const username = v.user?.name ?? v.cachedUsername ?? v.userId;
                const avatarUrl = v.user?.image ?? v.cachedAvatar ?? null;

                voteCountMap.set(v.userId, {
                    userId: v.userId,
                    username,
                    avatarUrl,
                    voteCount: 1,
                    fetchedDiscord: !!v.user?.name || !!v.cachedUsername,
                });
            }
        }

        const topVoters = [...voteCountMap.values()]
            .sort((a, b) => b.voteCount - a.voteCount)
            .slice(0, 5);

        // Voters with no cached display name get a placeholder immediately.
        // Discord API enrichment fires in the background so the response never blocks on it.
        for (const voter of topVoters) {
            if (!voter.fetchedDiscord && voter.username === voter.userId) {
                voter.username = 'Gizli Kullanıcı';
                this.fetchDiscordUser(voter.userId)
                    .then((discordUser) => {
                        if (!discordUser) return;
                        this.prisma.user.update({
                            where: { id: voter.userId },
                            data: { name: discordUser.name, image: discordUser.image },
                        }).catch(() => {});
                    })
                    .catch(() => {});
            }
        }

        // Owner Lookup
        // Server.ownerId = Discord snowflake (bot'tan geliyor).
        // User.id = CUID (NextAuth tarafından). Doğrudan eşleşmez.
        // Çözüm sırası: Account.providerAccountId → User.id → Discord API
        let ownerUser: { id: string; name: string | null; image: string | null } | null = null;

        // 1. Account tablosunda Discord ID (providerAccountId) ile ara → CUID çöz
        const ownerAccount = await this.prisma.account.findFirst({
            where: { provider: 'discord', providerAccountId: server.ownerId },
            select: { userId: true, user: { select: { id: true, name: true, image: true } } },
        });

        if (ownerAccount?.user) {
            ownerUser = ownerAccount.user;
        } else {
            // 2. Fallback: User.id olarak doğrudan dene (eski kayıtlar için)
            ownerUser = await this.prisma.user.findUnique({
                where: { id: server.ownerId },
                select: { name: true, image: true, id: true },
            });
        }

        // 3. Son çare: Discord Bot API üzerinden çek
        if (!ownerUser) {
            const discordOwner = await this.fetchDiscordUser(server.ownerId);
            if (discordOwner) {
                ownerUser = { id: server.ownerId, name: discordOwner.name, image: discordOwner.image };
            }
        }

        return { ...server, topVoters, owner: ownerUser };
    }


    /**
     * Redis leaderboard'dan gelen ID listesine göre sunucuları getirir.
     * Prisma sonuçlarını Redis'in belirlediği sıralamaya göre geri düzenler
     * (isPremium veya başka bir DB sıralaması bu sırayı bozmamalı).
     */
    async findByIds(ids: string[]): Promise<ServerSummary[]> {
        const servers = await this.prisma.server.findMany({
            where: { id: { in: ids }, isVisible: true, isBlacklisted: false },
            select: SERVER_SUMMARY_SELECT,
        });

        // Redis'ten gelen sırayı koru — Prisma kendi iç sırasını kullanır
        const serverMap = new Map(servers.map((s) => [s.id, s]));
        return ids.map((id) => serverMap.get(id)).filter((s): s is ServerSummary => s !== undefined);
    }

    /**
     * Redis'in boş olduğu durumlarda DB üzerinden leaderboard fallback.
     * isPremium boost YOKTUR — sadece gerçek metrik değeri dikkate alınır.
     */
    async findTopByMetric(type: 'voice' | 'members' | 'votes', limit: number): Promise<ServerSummary[]> {
        const orderBy = this.buildLeaderboardOrderBy(type);

        return this.prisma.server.findMany({
            where: { isVisible: true, isBlacklisted: false },
            orderBy,
            take: limit,
            select: SERVER_SUMMARY_SELECT,
        });
    }

    async update(id: string, updateServerDto: UserUpdateServerDto, requestingDiscordId: string) {
        const server = await this.prisma.server.findUnique({
            where: { id },
            select: { ownerId: true },
        });

        if (!server) throw new NotFoundException(`Server with ID ${id} not found`);
        if (server.ownerId !== requestingDiscordId) {
            throw new ForbiddenException('You do not own this server');
        }

        const result = await this.prisma.server.update({
            where: { id },
            data: { ...updateServerDto, version: { increment: 1 } },
        });

        await this.invalidateServer(id);
        return result;
    }

    /**
     * Bot tarafından yapılan partial update — sahiplik kontrolü yok.
     * Sadece BotGuard korumalı endpoint üzerinden çağrılır.
     * leaderboardChannelId / leaderboardMessageId gibi meta alanları günceller.
     */
    async updateByBot(id: string, dto: UpdateServerDto) {
        const { version, ...data } = dto as UpdateServerDto & { version?: number };

        const result = await this.prisma.server.update({
            where: { id },
            data: { ...data, version: { increment: 1 } },
        });

        await this.invalidateServer(id);
        return result;
    }

    async remove(id: string, requestingDiscordId: string) {
        const server = await this.prisma.server.findUnique({
            where: { id },
            select: { ownerId: true },
        });

        if (!server) throw new NotFoundException(`Server with ID ${id} not found`);
        if (server.ownerId !== requestingDiscordId) {
            throw new ForbiddenException('You do not own this server');
        }

        await this.prisma.server.delete({ where: { id } });
        await this.invalidateServer(id);
    }

    /** Get the total member count across all servers */
    async getTotalMemberCount(): Promise<number> {
        const result = await this.prisma.server.aggregate({
            _sum: { memberCount: true },
            where: { isVisible: true },
        });
        return result._sum.memberCount ?? 0;
    }

    async vote(serverId: string, userId: string, username?: string, avatarUrl?: string | null) {
        try {
            const result = await this.voteService.vote(serverId, userId, username, avatarUrl);

            this.eventsGateway.emitVoteUpdate(serverId, {
                votes: result.server.votes,
                lastVoterId: result.resolvedUserId
            });

            await Promise.allSettled([
                this.invalidateServer(serverId),
                this.leaderboard.updateVoteRank(serverId, result.server.votes),
            ]);

            return {
                success: result.success,
                server: result.server,
                nextVoteAvailable: result.nextVoteAvailable
            };
        } catch (error) {
            this.logger.error(`vote() failed — serverId=${serverId} userId=${userId}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }

    /**
     * Normal sunucu listesi (findAll) için sıralama — premium boost burada kasıtlı.
     * Leaderboard endpoint'leri bu metodu kullanmaz; Redis sıralamasını korurlar.
     */
    private buildOrderBy(
        sort: ServerSortField | undefined,
        ignorePremiumBoost?: boolean,
    ): { createdAt?: 'asc' | 'desc'; isPremium?: 'asc' | 'desc'; votes?: 'asc' | 'desc'; activeMemberCount?: 'asc' | 'desc'; voiceMemberCount?: 'asc' | 'desc'; boostCount?: 'asc' | 'desc'; memberCount?: 'asc' | 'desc' }[] {
        const hasPremiumBoost = !ignorePremiumBoost;
        switch (sort) {
            case ServerSortField.RANDOM:
                return [{ votes: 'desc' }]; // Fallback — raw query handles actual random
            case ServerSortField.NEWEST:
                return [{ createdAt: 'desc' }];
            case ServerSortField.OLDEST:
                return [{ createdAt: 'asc' }];
            case ServerSortField.CREATED_AT:
                return [{ createdAt: 'desc' }];
            case ServerSortField.VOICE:
                return hasPremiumBoost
                    ? [{ isPremium: 'desc' }, { voiceMemberCount: 'desc' }]
                    : [{ voiceMemberCount: 'desc' }];
            case ServerSortField.BOOST:
                return hasPremiumBoost
                    ? [{ isPremium: 'desc' }, { boostCount: 'desc' }]
                    : [{ boostCount: 'desc' }];
            case ServerSortField.MEMBERS:
                return hasPremiumBoost
                    ? [{ isPremium: 'desc' }, { memberCount: 'desc' }]
                    : [{ memberCount: 'desc' }];
            case ServerSortField.VOTES:
            default:
                return hasPremiumBoost
                    ? [{ isPremium: 'desc' }, { votes: 'desc' }]
                    : [{ votes: 'desc' }];
        }
    }

    /**
     * Leaderboard fallback için sıralama — isPremium boost YOK.
     * Sadece gerçek metrik değeri dikkate alınır.
     */
    buildLeaderboardOrderBy(
        type: 'voice' | 'members' | 'votes',
    ): { votes?: 'asc' | 'desc'; memberCount?: 'asc' | 'desc'; voiceMemberCount?: 'asc' | 'desc' }[] {
        switch (type) {
            case 'voice':
                return [{ voiceMemberCount: 'desc' }];
            case 'members':
                return [{ memberCount: 'desc' }];
            case 'votes':
            default:
                return [{ votes: 'desc' }];
        }
    }
}
