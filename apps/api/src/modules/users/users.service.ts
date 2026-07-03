import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Prisma } from '@prisma/client';

import { RedisCacheService } from '../../common/services/redis-cache.service.js';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redisCache: RedisCacheService,
    ) {}

    async findAll(limit: number = 50) {
        const users = await this.prisma.user.findMany({
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                name: true,
                image: true,
                banner: true,
                premiumLevel: true,
                role: true,
                occupation: true,
                gender: true,
                location: true,
                birthday: true,
                about: true,
                socialLinks: true,
                isPublished: true,
                badges: true,
                profileViews: true,
                hypePoints: true,
                trustScore: true,
                createdAt: true,
                _count: { select: { receivedLikes: true } },
            },
        });

        return users.map(user => ({
            ...user,
            banner: user.banner,
            birthday: user.birthday?.toISOString() ?? null,
            likeCount: user._count.receivedLikes,
            createdAt: user.createdAt.toISOString(),
        }));
    }

    /** Resolve a user by their internal DB id OR by their Discord snowflake id. */
    private async resolveUserForProfile(userId: string) {
        const SELECT = {
            id: true,
            name: true,
            image: true,
            banner: true,
            premiumLevel: true,
            role: true,
            occupation: true,
            gender: true,
            location: true,
            birthday: true,
            about: true,
            socialLinks: true,
            isPublished: true,
            badges: true,
            profileViews: true,
            hypePoints: true,
            trustScore: true,
            createdAt: true,
            _count: { select: { receivedLikes: true } },
        } as const;

        // Try direct lookup first (handles both cuid and Discord-id users)
        const direct = await this.prisma.user.findUnique({ where: { id: userId }, select: SELECT });
        if (direct) return direct;

        // Fallback: URL may carry the Discord snowflake while DB id is a cuid
        const account = await this.prisma.account.findFirst({
            where: { provider: 'discord', providerAccountId: userId },
            select: { userId: true },
        });
        if (!account) return null;

        return this.prisma.user.findUnique({ where: { id: account.userId }, select: SELECT });
    }

    async getProfile(userId: string, viewerId?: string) {
        const user = await this.resolveUserForProfile(userId);

        if (!user) throw new NotFoundException('User not found');
        // Allow the profile owner to view their own profile even before publishing.
        // Compare against user.id (real DB id) not the URL parameter.
        if (!user.isPublished && viewerId !== user.id) throw new ForbiddenException('Profile is not published');

        let hasLiked = false;
        if (viewerId && viewerId !== userId) {
            const like = await this.prisma.profileLike.findUnique({
                where: { userId_likerId: { userId: user.id, likerId: viewerId } },
            });
            hasLiked = !!like;
        }

        // We need the user's Discord Snowflake ID to find their servers, since Server.ownerId is a snowflake.
        const discordAccount = await this.prisma.account.findFirst({
            where: { userId: user.id, provider: 'discord' },
        });

        let ownedServers: {
            id: string;
            name: string;
            icon: string | null;
            memberCount: number;
            categories: string[];
            premiumTier: string;
        }[] = [];
        if (discordAccount) {
            // Fetch owned servers (public, visible)
            ownedServers = await this.prisma.server.findMany({
                where: { ownerId: discordAccount.providerAccountId, isVisible: true },
            select: {
                id: true,
                name: true,
                icon: true,
                memberCount: true,
                categories: true,
                premiumTier: true,
            },
            take: 20,
        });
        }

        return {
            id: user.id,
            discordId: discordAccount?.providerAccountId ?? user.id,
            name: user.name,
            image: user.image,
            banner: user.banner,
            premiumLevel: user.premiumLevel,
            role: user.role,
            occupation: user.occupation,
            gender: user.gender,
            location: user.location,
            birthday: user.birthday?.toISOString() ?? null,
            about: user.about,
            socialLinks: user.socialLinks,
            isPublished: user.isPublished,
            badges: user.badges,
            profileViews: user.profileViews,
            likeCount: user._count.receivedLikes,
            hypePoints: user.hypePoints,
            trustScore: user.trustScore,
            createdAt: user.createdAt.toISOString(),
            hasLiked,
            ownedServers,
        };
    }

    async getMyProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                banner: true,
                premiumLevel: true,
                role: true,
                occupation: true,
                gender: true,
                location: true,
                birthday: true,
                about: true,
                socialLinks: true,
                isPublished: true,
                badges: true,
                profileViews: true,
                hypePoints: true,
                trustScore: true,
                createdAt: true,
                _count: { select: { receivedLikes: true } },
            },
        });

        if (!user) throw new NotFoundException('User not found');

        return {
            ...user,
            banner: user.banner,
            birthday: user.birthday?.toISOString() ?? null,
            likeCount: user._count.receivedLikes,
            createdAt: user.createdAt.toISOString(),
        };
    }

    async updateProfile(userId: string, data: UpdateProfileDto) {
        if (data.socialLinks !== undefined && data.socialLinks !== null) {
            const links = data.socialLinks;
            if (links.length > 10) {
                throw new BadRequestException('En fazla 10 sosyal bağlantı ekleyebilirsiniz.');
            }
            for (const link of links) {
                const lower = link.toLowerCase().trim();
                if (lower.includes("discord.gg/") || lower.includes("discord.com/invite/")) {
                    throw new BadRequestException('Discord davet bağlantıları yasaktır.');
                }
                if (lower.includes(`/users/${userId}`)) {
                    throw new BadRequestException('Kendi profil adresinizi ekleyemezsiniz.');
                }
            }
        }

        const birthdayDate = data.birthday ? new Date(data.birthday) : (data.birthday === null ? null : undefined);

        const updateData: Prisma.UserUpdateInput = {};
        if (data.occupation !== undefined) updateData.occupation = data.occupation;
        if (data.gender !== undefined) updateData.gender = data.gender;
        if (data.location !== undefined) updateData.location = data.location;
        if (birthdayDate !== undefined) updateData.birthday = birthdayDate;
        if (data.about !== undefined) updateData.about = data.about;
        if (data.socialLinks !== undefined) {
            updateData.socialLinks = data.socialLinks === null
                ? Prisma.DbNull
                : data.socialLinks as Prisma.InputJsonValue;
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                image: true,
                banner: true,
                occupation: true,
                gender: true,
                location: true,
                birthday: true,
                about: true,
                socialLinks: true,
                isPublished: true,
                badges: true,
                profileViews: true,
                premiumLevel: true,
                role: true,
                hypePoints: true,
                trustScore: true,
                createdAt: true,
                _count: { select: { receivedLikes: true } },
            },
        });
    }

    async publishProfile(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Auto-award early supporter badge on first publish
        const badges = user.badges || [];
        if (!badges.includes('early_supporter')) {
            badges.push('early_supporter');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { isPublished: true, badges },
            select: { isPublished: true, badges: true },
        });
    }

    async recordView(userId: string, viewerIdOrIp: string, loggedInViewerId?: string) {
        // Don't count self-views
        if (loggedInViewerId && userId === loggedInViewerId) return;

        // Debounce: 1 hour (3600000 ms) per viewer/IP per profile
        const cacheKey = `profile_view:${userId}:${viewerIdOrIp}`;
        
        const hasViewedRecently = await this.redisCache.get(cacheKey);
        if (hasViewedRecently) return;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isPublished) return;

        // Set cache to debounce subsequent views from the same user/IP
        await this.redisCache.set(cacheKey, true, 3600000); // 1 hour TTL

        // Increment view count
        await this.prisma.user.update({
            where: { id: userId },
            data: { profileViews: { increment: 1 } },
        });
    }

    async toggleLike(userId: string, likerId: string) {
        if (userId === likerId) throw new ForbiddenException('Cannot like yourself');

        const existing = await this.prisma.profileLike.findUnique({
            where: { userId_likerId: { userId, likerId } },
        });

        if (existing) {
            await this.prisma.profileLike.delete({ where: { id: existing.id } });
            const count = await this.prisma.profileLike.count({ where: { userId } });
            return { liked: false, likes: count };
        }

        await this.prisma.profileLike.create({
            data: { userId, likerId },
        });
        const count = await this.prisma.profileLike.count({ where: { userId } });
        return { liked: true, likes: count };
    }

    private async refreshDiscordToken(accountId: string, refreshToken: string) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('[UsersService] Discord client credentials missing for token refresh');
            return null;
        }

        try {
            const params = new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            });

            const response = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[UsersService] Failed to refresh Discord token: ${response.status} ${errText}`);
                return null;
            }

            const data = await response.json() as {
                access_token: string;
                refresh_token: string;
                expires_in: number;
                scope: string;
            };

            const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
            await this.prisma.account.update({
                where: { id: accountId },
                data: {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expires_at: expiresAt,
                    scope: data.scope,
                },
            });

            console.log('[UsersService] Successfully refreshed Discord token');
            return data.access_token;
        } catch (error) {
            console.error('[UsersService] Error refreshing Discord token:', error);
            return null;
        }
    }

    async getMyServers(userId: string) {
        const discordAccount = await this.prisma.account.findFirst({
            where: { userId, provider: 'discord' },
        });
        if (!discordAccount) {
            return [];
        }

        // Fallback list: servers owned by this user in database
        const dbOwnedServers = await this.prisma.server.findMany({
            where: { ownerId: discordAccount.providerAccountId },
            select: {
                id: true,
                name: true,
                icon: true,
                memberCount: true,
                isPremium: true,
                premiumTier: true,
                premiumExpiresAt: true,
            },
            orderBy: { name: 'asc' },
        });

        let accessToken = discordAccount.access_token;
        if (!accessToken) {
            return dbOwnedServers;
        }

        let guilds: any[] = [];
        let fetchSuccessful = false;

        try {
            let response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.status === 401 && discordAccount.refresh_token) {
                console.log('[UsersService] Access token expired. Attempting refresh...');
                const newAccessToken = await this.refreshDiscordToken(discordAccount.id, discordAccount.refresh_token);
                if (newAccessToken) {
                    accessToken = newAccessToken;
                    response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                }
            }

            if (response.ok) {
                guilds = await response.json() as any[];
                fetchSuccessful = true;
            } else {
                console.warn(`[UsersService] Discord API returned ${response.status} even after attempted refresh.`);
            }
        } catch (err) {
            console.error('[getMyServers] Error fetching guilds from Discord:', err);
        }

        if (!fetchSuccessful) {
            return dbOwnedServers;
        }

        const ADMINISTRATOR_PERMISSION = 0x8;
        const MANAGE_GUILD_PERMISSION = 0x20;
        const allowedGuildIds = guilds
            .filter((guild) => {
                if (guild.owner) return true;
                try {
                    const perms = BigInt(guild.permissions);
                    return (perms & BigInt(ADMINISTRATOR_PERMISSION)) === BigInt(ADMINISTRATOR_PERMISSION) ||
                           (perms & BigInt(MANAGE_GUILD_PERMISSION)) === BigInt(MANAGE_GUILD_PERMISSION);
                } catch {
                    return false;
                }
            })
            .map((guild) => guild.id);

        // Fetch servers matching these guild IDs from our database
        const servers = await this.prisma.server.findMany({
            where: { id: { in: allowedGuildIds } },
            select: {
                id: true,
                name: true,
                icon: true,
                memberCount: true,
                isPremium: true,
                premiumTier: true,
                premiumExpiresAt: true,
            },
            orderBy: { name: 'asc' },
        });

        // Combine with database owned servers (to make sure no server is missed)
        const serverMap = new Map();
        for (const s of dbOwnedServers) {
            serverMap.set(s.id, s);
        }
        for (const s of servers) {
            serverMap.set(s.id, s);
        }

        return Array.from(serverMap.values());
    }

    async redeemPremiumCode(userId: string, code: string, serverId: string) {
        // 1. Resolve user's Discord account
        const discordAccount = await this.prisma.account.findFirst({
            where: { userId, provider: 'discord' },
        });
        if (!discordAccount) {
            throw new ForbiddenException('Premium kodu aktive edebilmek için Discord hesabınızın bağlı olması gerekir.');
        }

        // 2. Fetch premium code details
        const premiumCode = await this.prisma.premiumCode.findUnique({
            where: { code },
        });
        if (!premiumCode) {
            throw new NotFoundException('Girdiğiniz premium kod geçerli değil.');
        }
        if (premiumCode.isUsed) {
            throw new BadRequestException('Bu premium kod zaten kullanılmış.');
        }

        // 3. Fetch server details
        const server = await this.prisma.server.findUnique({
            where: { id: serverId },
        });
        if (!server) {
            throw new NotFoundException('Seçilen sunucu sistemde bulunamadı.');
        }

        // 4. Verify server ownership or admin permissions
        let hasAccess = server.ownerId === discordAccount.providerAccountId;
        let accessToken = discordAccount.access_token;

        if (!hasAccess && accessToken) {
            try {
                let response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (response.status === 401 && discordAccount.refresh_token) {
                    console.log(`[UsersService] Access token expired for user ${userId} during redeem. Attempting refresh...`);
                    const newAccessToken = await this.refreshDiscordToken(discordAccount.id, discordAccount.refresh_token);
                    if (newAccessToken) {
                        accessToken = newAccessToken;
                        response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        });
                    }
                }

                if (response.ok) {
                    const guilds = await response.json() as Array<{
                        id: string;
                        owner: boolean;
                        permissions: string;
                    }>;
                    const targetGuild = guilds.find((g) => g.id === serverId);
                    if (targetGuild) {
                        const ADMINISTRATOR_PERMISSION = 0x8;
                        const MANAGE_GUILD_PERMISSION = 0x20;
                        const perms = BigInt(targetGuild.permissions);
                        const isAdmin = (perms & BigInt(ADMINISTRATOR_PERMISSION)) === BigInt(ADMINISTRATOR_PERMISSION) ||
                                        (perms & BigInt(MANAGE_GUILD_PERMISSION)) === BigInt(MANAGE_GUILD_PERMISSION);
                        if (targetGuild.owner || isAdmin) {
                            hasAccess = true;
                        }
                    }
                }
            } catch (err) {
                console.error('[redeemPremiumCode] Error validating permissions against Discord:', err);
            }
        }

        if (!hasAccess) {
            throw new ForbiddenException('Bu sunucunun sahibi veya yöneticisi (Yönetici/Sunucuyu Yönet yetkisine sahip) olmadığınız için premium kodunu uygulayamazsınız.');
        }

        // 5. Execute secure redemption in transaction to prevent race conditions
        return this.prisma.$transaction(async (tx) => {
            // Re-fetch inside transaction and verify it is still unused
            const codeInTx = await tx.premiumCode.findUnique({
                where: { id: premiumCode.id },
            });
            if (!codeInTx || codeInTx.isUsed) {
                throw new BadRequestException('Bu premium kod başka bir işlem tarafından kullanıldı.');
            }

            // Mark the code as used. Use updateMany with isUsed check for extra security.
            const updateCode = await tx.premiumCode.updateMany({
                where: { id: premiumCode.id, isUsed: false },
                data: {
                    isUsed: true,
                    usedById: userId,
                    usedAt: new Date(),
                    usedServerId: serverId,
                },
            });
            if (updateCode.count === 0) {
                throw new BadRequestException('Bu premium kod başka bir işlem tarafından kullanıldı.');
            }

            // Calculate premium expiry duration
            const durationMs = premiumCode.duration * 24 * 60 * 60 * 1000;
            const now = new Date();
            let newExpiresAt: Date;

            if (server.isPremium && server.premiumExpiresAt && server.premiumExpiresAt.getTime() > now.getTime()) {
                // If already premium, extend the duration from current expiration
                newExpiresAt = new Date(server.premiumExpiresAt.getTime() + durationMs);
            } else {
                newExpiresAt = new Date(now.getTime() + durationMs);
            }

            // Update server premium status
            await tx.server.update({
                where: { id: serverId },
                data: {
                    isPremium: true,
                    premiumTier: 'PREMIUM',
                    premiumExpiresAt: newExpiresAt,
                },
            });

            return {
                success: true,
                message: 'Premium başarıyla aktif edildi!',
                premiumExpiresAt: newExpiresAt.toISOString(),
            };
        });
    }
}
