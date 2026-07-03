import { api } from "@/lib/api";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { UserProfileClient } from "./client-page";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hypez.live";
  try {
    // Try direct DB id first
    let user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, about: true },
    });

    // Fallback: treat id as Discord snowflake
    if (!user) {
      const account = await prisma.account.findFirst({
        where: { provider: "discord", providerAccountId: id },
        select: {
          user: {
            select: { name: true, about: true },
          },
        },
      });
      if (account?.user) user = account.user;
    }

    if (!user) return { title: "Hypez - Kullanıcı Bulunamadı" };

    const displayName = user.name || "Hypez Kullanıcısı";

    return {
      title: `${displayName} - Hypez`,
      description: user.about || `${displayName} adlı kullanıcının Hypez profilini görüntüle.`,
      openGraph: {
        title: `${displayName} - Hypez`,
        description: user.about || `${displayName} adlı kullanıcının Hypez profilini görüntüle.`,
        url: `${baseUrl}/users/${id}`,
        siteName: "Hypez",
      },
    };
  } catch {
    return { title: "Hypez" };
  }
}

const USER_SELECT = {
  id: true, name: true, image: true, banner: true, premiumLevel: true, role: true,
  occupation: true, gender: true, location: true, birthday: true,
  about: true, socialLinks: true, isPublished: true, badges: true,
  profileViews: true, hypePoints: true, trustScore: true, createdAt: true,
  accounts: {
    where: { provider: "discord" },
    select: { providerAccountId: true },
  },
  _count: { select: { receivedLikes: true } },
} as const;

/**
 * Find a user by their internal DB id OR by their Discord snowflake id.
 * Handles old users whose DB id is a cuid while the URL carries their Discord id.
 */
async function resolveUserByAnyId(id: string) {
  const direct = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (direct) return direct;

  const account = await prisma.account.findFirst({
    where: { provider: 'discord', providerAccountId: id },
    select: { userId: true },
  });
  if (!account) return null;

  return prisma.user.findUnique({ where: { id: account.userId }, select: USER_SELECT });
}

/**
 * Check if the current session user is the owner of the profile at URL param `id`.
 * Handles cuid DB ids, Discord snowflake ids, and missing discordId in old sessions.
 */
async function resolveOwnership(
  sessionUserId: string | undefined,
  sessionDiscordId: string | undefined,
  urlId: string,
): Promise<{ isOwner: boolean; dbUserId: string | null }> {
  if (!sessionUserId) return { isOwner: false, dbUserId: null };

  // Direct id match (new users: Discord id = DB id)
  if (sessionUserId === urlId) return { isOwner: true, dbUserId: sessionUserId };

  // Discord id from session matches URL
  if (sessionDiscordId && sessionDiscordId === urlId) return { isOwner: true, dbUserId: sessionUserId };

  // Fallback: check in DB whether the sessionUserId owns a Discord account with this snowflake
  // (old users: DB id is cuid, URL carries Discord id, session may not have discordId stored)
  const account = await prisma.account.findFirst({
    where: { provider: 'discord', providerAccountId: urlId, userId: sessionUserId },
    select: { userId: true },
  });
  if (account) return { isOwner: true, dbUserId: account.userId };

  return { isOwner: false, dbUserId: null };
}

function buildProfileShape(user: NonNullable<Awaited<ReturnType<typeof resolveUserByAnyId>>>) {
  const discordId = (user as any).accounts?.[0]?.providerAccountId ?? user.id;
  return {
    id: user.id,
    discordId,
    name: user.name,
    image: user.image,
    banner: (user as any).banner ?? null,
    premiumLevel: user.premiumLevel,
    role: user.role,
    occupation: user.occupation,
    gender: user.gender,
    location: user.location,
    birthday: user.birthday?.toISOString() ?? null,
    about: user.about,
    socialLinks: Array.isArray(user.socialLinks) 
      ? user.socialLinks 
      : (user.socialLinks && typeof user.socialLinks === 'object' 
          ? Object.values(user.socialLinks).filter(v => typeof v === 'string' && v.trim() !== '') 
          : []),
    isPublished: user.isPublished,
    badges: user.badges,
    profileViews: user.profileViews,
    hypePoints: user.hypePoints,
    trustScore: user.trustScore,
    createdAt: user.createdAt.toISOString(),
    likeCount: user._count.receivedLikes,
    hasLiked: false,
    ownedServers: [],
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const { isOwner, dbUserId } = await resolveOwnership(
    session?.user?.id,
    session?.user?.discordId,
    id,
  );

  if (isOwner && dbUserId) {
    // Owner: bypass NestJS API — fetch directly from DB, no token needed
    const user = await prisma.user.findUnique({ where: { id: dbUserId }, select: USER_SELECT });
    if (!user) return notFound();

    if (!user.isPublished) redirect('/profile?publish=1');

    const discordAccount = await prisma.account.findFirst({
      where: { userId: dbUserId, provider: 'discord' },
    });

    let ownedServers: any[] = [];
    if (discordAccount) {
      ownedServers = await prisma.server.findMany({
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

    const profileData = buildProfileShape(user);
    profileData.ownedServers = ownedServers as any;

    return <UserProfileClient profile={profileData as any} userId={user.id} />;
  }

  // Non-owner: go through the NestJS public API (enforces published check)
  const profile = await api.getUserProfile(id, session?.apiToken ?? undefined);

  if (!profile) return notFound();

  if (profile === 'not_published') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-zinc-500">403</h1>
          <p className="text-xl text-zinc-400">Profil yayınlanmadı</p>
          <p className="text-zinc-500">Bu kullanıcı profilini henüz herkese açmadı.</p>
          <Link
            href="/servers"
            className="inline-block mt-4 px-6 py-2 rounded-full bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            Sunucuları Keşfet
          </Link>
        </div>
      </div>
    );
  }

  return <UserProfileClient profile={profile} userId={id} />;
}
