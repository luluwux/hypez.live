import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileEditForm, type ProfileFormUser } from "./ProfileEditForm";

function discordSnowflakeToDate(snowflakeId: string): string | null {
    try {
        const id = BigInt(snowflakeId);
        const timestamp = Number((id >> 22n) + 1420070400000n);
        return new Date(timestamp).toISOString();
    } catch {
        return null;
    }
}

export default async function ProfileSettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ publish?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { publish } = await searchParams;
    const highlightPublish = publish === '1';

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            image: true,
            banner: true,
            createdAt: true,
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
            premiumLevel: true,
            role: true,
            _count: { select: { receivedLikes: true } },
        },
    });

    if (!user) redirect("/login");

    const formUser: ProfileFormUser = {
        id: user.id,
        name: user.name,
        image: session.user?.image || user.image,
        banner: (user as any).banner ?? null,
        createdAt: user.createdAt.toISOString(),
        discordJoinDate: discordSnowflakeToDate(session.user?.discordId || user.id),
        occupation: user.occupation,
        gender: user.gender,
        location: user.location,
        birthday: user.birthday ? user.birthday.toISOString().split("T")[0]! : null,
        about: user.about,
        socialLinks: (Array.isArray(user.socialLinks) 
            ? user.socialLinks 
            : (user.socialLinks && typeof user.socialLinks === 'object' 
                ? Object.values(user.socialLinks).filter(v => typeof v === 'string' && v.trim() !== '') 
                : [])) as string[],
        isPublished: user.isPublished,
        badges: user.badges,
        profileViews: user.profileViews,
        hypePoints: user.hypePoints,
        trustScore: user.trustScore,
        premiumLevel: user.premiumLevel,
        role: user.role,
        likeCount: user._count.receivedLikes,
    };

    return <ProfileEditForm user={formUser} highlightPublish={highlightPublish} />;
}
