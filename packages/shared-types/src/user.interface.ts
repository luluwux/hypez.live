import { PremiumTier } from './enums.js';

export type UserRole = 'USER' | 'ADMIN';

export type UserBadge = 'admin' | 'verified' | 'early_supporter' | 'premium' | 'token';

export type UserSocialLinks = string[];

export interface UserProfile {
    id: string;
    discordId?: string;
    name?: string | null;
    displayName?: string | null;
    image?: string | null;
    banner?: string | null;
    premiumLevel: number;
    role: UserRole;
    occupation?: string | null;
    gender?: string | null;
    location?: string | null;
    birthday?: string | null;
    about?: string | null;
    socialLinks?: UserSocialLinks | null;
    isPublished: boolean;
    badges: UserBadge[];
    profileViews: number;
    likeCount: number;
    hypePoints: number;
    trustScore: number;
    createdAt: string;
    /** Whether the current viewer has liked this profile */
    hasLiked?: boolean;
    /** Servers owned by this user */
    ownedServers?: UserOwnedServer[];
}

export interface UserOwnedServer {
    id: string;
    name: string;
    icon?: string | null;
    memberCount: number;
    categories: string[];
    premiumTier?: PremiumTier | null;
}

export interface UpdateProfileDto {
    occupation?: string | null;
    gender?: string | null;
    location?: string | null;
    birthday?: string | null;
    about?: string | null;
    socialLinks?: UserSocialLinks | null;
}
