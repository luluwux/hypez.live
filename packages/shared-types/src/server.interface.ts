import { PremiumTier } from './enums.js';

export interface ServerStats {
    id: string;
    serverId: string;
    voiceCount: number;
    messageCount: number;
    recordedAt: string;
}

export interface ServerEmoji {
    id: string;
    emojiId: string;
    name: string;
    url: string;
    animated?: boolean;
}

export interface ServerSticker {
    id: string;
    stickerId: string;
    name: string;
    url: string;
    format?: string;
}

export interface TopVoter {
    userId: string;
    username: string;
    avatarUrl?: string | null;
    voteCount: number;
}

export interface ServerBadge {
    id: string;
    label: string;
    icon: string;
    color: string;
    description: string;
}

export interface Server {
    id: string;
    name: string;
    icon: string | null;
    banner?: string | null;
    description?: string | null;
    memberCount: number;
    votes: number;
    categories: string[];
    subCategories?: string[];
    language?: string;
    premiumTier?: PremiumTier;
    isPremium?: boolean;
    isToken?: boolean;
    isVisible?: boolean;
    isBlacklisted?: boolean;
    blacklistReason?: string | null;
    badges?: string[];
    nsfw?: boolean;
    activeMemberCount?: number;
    boostCount?: number;
    channelCount?: number;
    roleCount?: number;
    emojiCount?: number;
    stickerCount?: number;
    voiceMemberCount?: number;
    streamingMemberCount?: number;
    videoMemberCount?: number;
    normalVoiceMemberCount?: number;
    locale?: string;
    inviteUrl?: string | null;
    weeklyHypeScore?: number;
    totalHypeScore?: number;
    weeklyMessageCount?: number;
    weeklyVoiceMinutes?: number;
    createdAt?: string | Date;
    stats?: ServerStats[];
    emojis?: ServerEmoji[];
    stickers?: ServerSticker[];
    topVoters?: TopVoter[];
}
