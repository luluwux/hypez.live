import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { DiscordProfile } from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { SignJWT, jwtVerify } from "jose";
import { PrismaClient, Prisma } from "@prisma/client";

import { createRequire } from "module";

let redis: InstanceType<typeof import("ioredis").default> | null = null;
if (process.env.NEXT_RUNTIME !== "edge") {
    try {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            const req = createRequire(import.meta.url);
            const RedisClass = req("ioredis") as typeof import("ioredis").default;
            redis = new RedisClass(redisUrl.replace("localhost", "127.0.0.1"));
        }
    } catch {
        // Redis unavailable — ghost user merge and cooldown invalidation will be skipped
    }
}

// Extended types defined in types/next-auth.d.ts

// Helper function to calculate Trust Score from Discord profile
function calculateTrustScore(profile: DiscordProfile, emailVerified: boolean = false): number {
    let score = 0;

    // 1. Account Age (Discord Snowflake to Date)
    // Base 20 for 1+ year, then +10 for each additional year
    if (profile.id) {
        try {
            const id = BigInt(profile.id);
            const timestamp = (id >> 22n) + 1420070400000n;
            const accountAgeMs = Date.now() - Number(timestamp);
            const oneYear = 365 * 24 * 60 * 60 * 1000;
            const accountAgeYears = Math.floor(accountAgeMs / oneYear);

            if (accountAgeYears >= 1) {
                score += 20; // Base for 1+ year
                // +10 for each additional year beyond first year
                const extraYears = accountAgeYears - 1;
                score += extraYears * 10;
            }
        } catch (e) {
            console.error('Error calculating account age:', e);
        }
    }

    // 2. Discord Phone Verification
    if (profile.verified) score += 20;

    // 3. Email Verification (NextAuth emailVerified field)
    if (emailVerified) score += 20;

    return Math.min(score, 100); // Max 100
}

// Extend PrismaAdapter to persist trustScore
function customPrismaAdapter(prismaInstance: PrismaClient): Adapter {
    const baseAdapter = PrismaAdapter(prismaInstance);

    return {
        ...baseAdapter,
        async createUser(data: AdapterUser) {
            const emailVerified = data.emailVerified ? new Date() : null;
            // Account age requires the Discord snowflake, which is only available in
            // signIn/jwt callbacks. Start with email-verification bonus only.
            const trustScore = emailVerified ? 20 : 0;

            const user = await prismaInstance.user.create({
                data: {
                    id: data.id,
                    name: data.name,
                    displayName: (data as { displayName?: string }).displayName,
                    email: data.email,
                    emailVerified: emailVerified,
                    image: data.image,
                    banner: (data as { banner?: string }).banner,
                    trustScore,
                }
            });

            return user as unknown as AdapterUser;
        }
    } as Adapter;
}

const config = {

    adapter: customPrismaAdapter(prisma),

    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID ?? "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: { params: { scope: "identify email guilds" } },
            profile(profile) {
                let bannerUrl = null;
                if (profile.banner) {
                    const isGif = profile.banner.startsWith('a_');
                    bannerUrl = `https://cdn.discordapp.com/banners/${profile.id}/${profile.banner}.${isGif ? 'gif' : 'png'}?size=512`;
                }

                return {
                    id: profile.id,
                    name: profile.username,
                    displayName: profile.global_name || profile.username,
                    email: profile.email,
                    emailVerified: profile.verified ? new Date().toISOString() : null,
                    image: profile.avatar
                        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=256`
                        : null,
                    banner: bannerUrl,
                    role: "USER" as const,
                    premiumLevel: 0,
                    isPremium: false,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, account, profile }) {
            // Capture Discord ID on sign in
            if (account && profile) {
                token.discordId = profile.id as string;
                const discordProfile = profile as { avatar?: string | null; id?: string; verified?: boolean; banner?: string | null; };
                let freshPicture = null;
                if (discordProfile.avatar && discordProfile.id) {
                    freshPicture = `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png?size=256`;
                    token.picture = freshPicture;
                } else if (discordProfile.id) {
                    freshPicture = `https://cdn.discordapp.com/embed/avatars/${parseInt(discordProfile.id) % 5}.png`;
                    token.picture = freshPicture;
                }

                let freshBanner = null;
                if (discordProfile.banner && discordProfile.id) {
                    const isGif = discordProfile.banner.startsWith('a_');
                    freshBanner = `https://cdn.discordapp.com/banners/${discordProfile.id}/${discordProfile.banner}.${isGif ? 'gif' : 'png'}?size=512`;
                }

                // Always sync username + image + banner on OAuth sign-in
                if (user?.id) {
                    const discordProfileInfo = profile as DiscordProfile;
                    const freshName = discordProfileInfo.username || profile.name || user.name;
                    const freshDisplayName = discordProfileInfo.global_name || freshName;
                    try {
                        const updateData: Prisma.UserUpdateInput = {};
                        if (freshName) updateData.name = freshName;
                        if (freshDisplayName) updateData.displayName = freshDisplayName;
                        if (freshPicture) updateData.image = freshPicture;
                        if (freshBanner) updateData.banner = freshBanner;

                        await prisma.user.update({
                            where: { id: user.id },
                            data: updateData,
                        });                        token.name = freshName || undefined;
                        token.displayName = freshDisplayName || undefined;
                    } catch {
                        // Non-critical sync failure — token still valid
                    }
                }

                // Update access_token and refresh_token in Account table to keep it fresh
                try {
                    await prisma.account.update({
                        where: {
                            provider_providerAccountId: {
                                provider: 'discord',
                                providerAccountId: (account.providerAccountId || profile.id) as string,
                            },
                        },
                        data: {
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            scope: account.scope,
                        },
                    });
                } catch (e) {
                    console.error("Failed to update discord account tokens in DB:", e);
                }
            }

            if (user) {
                token.id = user.id!;
                token.role = user.role;
                token.premiumLevel = user.premiumLevel;
                token.username = user.username || undefined;
                token.displayName = (user as { displayName?: string }).displayName || undefined;
                if (user.image && !(account && profile)) {
                    token.picture = user.image;
                }
            }

            // Safety net for old sessions that predate the token.id field
            if (!token.id && token.sub) {
                token.id = token.sub;
            }

            // Synchronize role and premiumLevel from DB and verify Discord staff role membership
            if (token.id) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { role: true, premiumLevel: true }
                    });
                    if (dbUser) {
                        token.role = dbUser.role as "USER" | "ADMIN";
                        token.premiumLevel = dbUser.premiumLevel;
                    }

                    const discordId = token.discordId as string | undefined;
                    const botToken = process.env.DISCORD_TOKEN;

                    if (discordId && botToken && token.role !== "ADMIN") {
                        const now = Date.now();
                        const lastCheck = token.lastDiscordRoleCheck as number | undefined;
                        const FIVE_MINUTES = 5 * 60 * 1000;

                        if (!lastCheck || (now - lastCheck) > FIVE_MINUTES) {
                            token.lastDiscordRoleCheck = now;

                            const GUILD_ID = process.env.DISCORD_STAFF_GUILD_ID;
                            const ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID;

                            if (GUILD_ID && ROLE_ID) {
                                const response = await fetch(
                                    `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
                                    {
                                        headers: {
                                            Authorization: `Bot ${botToken}`,
                                        },
                                    }
                                );

                                if (response.ok) {
                                    const memberData = await response.json() as { roles: string[] };
                                    if (memberData.roles && memberData.roles.includes(ROLE_ID)) {
                                        token.role = "ADMIN";

                                        // Update database to match
                                        if (dbUser && dbUser.role !== "ADMIN") {
                                            await prisma.user.update({
                                                where: { id: token.id as string },
                                                data: { role: "ADMIN" }
                                            }).catch(() => {});
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to sync user role in JWT callback:", e);
                }
            }

            // Ensure the backend API token is always valid.
            const secretKey = process.env.JWT_SECRET || process.env.AUTH_SECRET;
            if (secretKey) {
                const userId = (user?.id ?? token.id ?? token.sub) as string | undefined;
                const existingApiToken = token.apiToken as string | undefined;
                let needsRefresh = !existingApiToken || !userId;

                if (existingApiToken && !needsRefresh) {
                    try {
                        const secret = new TextEncoder().encode(secretKey);
                        const { payload } = await jwtVerify(existingApiToken, secret);
                        const exp = payload.exp as number | undefined;
                        // Refresh when fewer than 24 hours remain
                        needsRefresh = exp !== undefined && (exp - Math.floor(Date.now() / 1000)) < 86400;
                    } catch {
                        needsRefresh = true;
                    }
                }

                if (needsRefresh && userId) {
                    try {
                        const secret = new TextEncoder().encode(secretKey);
                        const jti = crypto.randomUUID();
                        const apiToken = await new SignJWT({ discordId: token.discordId })
                            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
                            .setSubject(userId)
                            .setJti(jti)
                            .setIssuedAt()
                            .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
                            .sign(secret);
                        token.apiToken = apiToken;
                        token.apiTokenJti = jti;
                    } catch {
                        // Token refresh failed — existing token will be used until it expires
                    }
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id ?? token.sub) as string;
                session.user.role = token.role as "USER" | "ADMIN";
                session.user.premiumLevel = token.premiumLevel as number;
                session.user.username = token.username as string | undefined;
                session.user.displayName = token.displayName as string | undefined;
                session.user.discordId = token.discordId;
                session.user.image = (token.picture as string) ?? session.user.image;
            }
            if (token.apiToken) {
                session.apiToken = token.apiToken;
            }
            return session;
        },
    },
    events: {
        async signOut(message) {
            const token = 'token' in message ? message.token : null;
            const jti = token?.apiTokenJti as string | undefined;
            if (jti && redis) {
                // Blacklist JTI slightly beyond the token's max lifetime (7d default)
                await redis.set(`blacklist:jwt:${jti}`, '1', 'EX', 8 * 24 * 60 * 60).catch(() => {});
            }
        },

        async signIn({ user, profile, isNewUser }) {
            if (user.id && profile) {
                try {
                    const dp = profile as DiscordProfile;
                    const freshName = dp.username || profile.name || null;
                    const freshDisplayName = dp.global_name || freshName;
                    if (freshName) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { name: freshName, displayName: freshDisplayName },
                        });
                    }
                } catch {
                    // Non-critical
                }

                if (isNewUser) {
                    try {
                        const dp2 = profile as { verified?: boolean };
                        if (dp2.verified) {
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { trustScore: { increment: 20 } },
                            });
                        }
                    } catch {
                        // Non-critical
                    }
                }

                if (!isNewUser) {
                    try {
                        const currentUser = await prisma.user.findUnique({
                            where: { id: user.id },
                            select: { trustScore: true, emailVerified: true },
                        });
                        if (currentUser) {
                            const newScore = calculateTrustScore(profile as DiscordProfile, !!currentUser.emailVerified);
                            if (newScore > currentUser.trustScore) {
                                await prisma.user.update({
                                    where: { id: user.id },
                                    data: { trustScore: newScore },
                                });
                            }
                        }
                    } catch {
                        // Non-critical
                    }
                }

                const ghostId = profile.id;
                const realUserId = user.id;

                if (ghostId && realUserId && ghostId !== realUserId) {
                    try {
                        const ghostUser = await prisma.user.findUnique({
                            where: { id: ghostId },
                            include: { accounts: true }
                        });

                        if (ghostUser && ghostUser.accounts.length === 0) {
                            
                            await prisma.$transaction(async (tx) => {
                                // 1. Oyları aktar
                                await tx.vote.updateMany({
                                    where: { userId: ghostId },
                                    data: { userId: realUserId }
                                });

                                // 2. Hype oylarını aktar
                                await tx.hypeVote.updateMany({
                                    where: { userId: ghostId },
                                    data: { userId: realUserId }
                                });

                                // 3. Beğenileri aktar (likedUser)
                                const liked = await tx.profileLike.findMany({ where: { userId: ghostId } });
                                for (const like of liked) {
                                    const exists = await tx.profileLike.findUnique({
                                        where: { userId_likerId: { userId: realUserId, likerId: like.likerId } }
                                    });
                                    if (exists) {
                                        await tx.profileLike.delete({ where: { id: like.id } });
                                    } else {
                                        await tx.profileLike.update({
                                            where: { id: like.id },
                                            data: { userId: realUserId }
                                        });
                                    }
                                }

                                // 4. Verilen beğenileri aktar (likerUser)
                                const given = await tx.profileLike.findMany({ where: { likerId: ghostId } });
                                for (const like of given) {
                                    const exists = await tx.profileLike.findUnique({
                                        where: { userId_likerId: { userId: like.userId, likerId: realUserId } }
                                    });
                                    if (exists) {
                                        await tx.profileLike.delete({ where: { id: like.id } });
                                    } else {
                                        await tx.profileLike.update({
                                            where: { id: like.id },
                                            data: { likerId: realUserId }
                                        });
                                    }
                                }

                                // 5. Başvuruları aktar
                                await tx.application.updateMany({
                                    where: { userId: ghostId },
                                    data: { userId: realUserId }
                                });

                                // 6. Doğrulama oturumlarını aktar
                                await tx.verificationSession.updateMany({
                                    where: { userId: ghostId },
                                    data: { userId: realUserId }
                                });

                                // Silmeden önce kalan kayıtları kontrol et
                                const remainingVotes = await tx.vote.count({ where: { userId: ghostId } });
                                const remainingHype = await tx.hypeVote.count({ where: { userId: ghostId } });
                                if (remainingVotes > 0 || remainingHype > 0) {
                                    throw new Error(`[Merge] Migration incomplete for ghost user ${ghostId}. Votes: ${remainingVotes}, HypeVotes: ${remainingHype}. Aborting delete.`);
                                }

                                // 7. Ghost user'ı sil
                                await tx.user.delete({ where: { id: ghostId } });
                            });

                            // Redis cache invalidation
                            if (redis) {
                                await redis.del(`user:discord-to-cuid:${ghostId}`);
                                await redis.set(`user:discord-to-cuid:${ghostId}`, realUserId, "EX", 86400);

                                try {
                                    let cursor = "0";
                                    do {
                                        const [nextCursor, keys] = await redis.scan(
                                            cursor,
                                            "MATCH",
                                            `vote:cooldown:${ghostId}:*`,
                                            "COUNT",
                                            100
                                        );
                                        cursor = nextCursor;
                                        if (keys.length > 0) {
                                            await redis.del(keys);
                                        }
                                    } while (cursor !== "0");
                                } catch {
                                    // Non-critical: cooldown keys will expire naturally
                                }
                            }
                        }
                    } catch {
                        // Merge failure is non-fatal — user can still log in
                    }
                }
            }
        }
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    session: {
        strategy: "jwt",
    },

    secret: process.env.AUTH_SECRET,
    trustHost: true,
} satisfies NextAuthConfig;


export const { handlers, auth, signIn, signOut } = NextAuth(config);
