"use client";

import { cn } from "@/lib/utils";
import { Server } from "@/lib/api";
import {
    Bot, Crown, Clock, BadgeCheck, Radio, Sparkles, Star, Shield,
    TrendingUp, MessageCircle, Headphones, Gamepad2, Palette
} from "lucide-react";

interface ServerBadgesProps {
    server: Server;
    className?: string;
}

interface BadgeDef {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    condition: (s: Server) => boolean;
    description: string;
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipArrow } from "@/components/ui/tooltip";

const BADGE_DEFS: BadgeDef[] = [
    {
        id: 'premium',
        label: 'Premium',
        icon: Sparkles,
        color: 'text-sky-300',
        bgColor: '',
        condition: (s) => s.premiumTier === 'PREMIUM' || s.isPremium === true,
        description: 'Premium üye sunucu',
    },
    {
        id: 'token',
        label: 'Token',
        icon: Crown,
        color: 'text-amber-300',
        bgColor: '',
        condition: (s) => s.isToken === true || s.premiumTier === 'TOKEN',
        description: 'Token sahibi sunucu',
    },
    {
        id: 'new_bot',
        label: 'Yeni Bot',
        icon: Bot,
        color: 'text-green-300',
        bgColor: '',
        condition: (s) => {
            if (!s.createdAt) return false;
            const created = new Date(s.createdAt).getTime();
            const hoursSince = (Date.now() - created) / (1000 * 60 * 60);
            return hoursSince <= 24;
        },
        description: 'Son 24 saatte eklenen bot',
    },
    {
        id: 'early_supporter',
        label: 'Erken Destekçi',
        icon: Clock,
        color: 'text-purple-300',
        bgColor: '',
        condition: (s) => s.badges?.includes('early_supporter') ?? false,
        description: 'İlk destekçilerden',
    },
    {
        id: 'verified',
        label: 'Doğrulanmış',
        icon: BadgeCheck,
        color: 'text-emerald-300',
        bgColor: '',
        condition: (s) => s.badges?.includes('verified') ?? false,
        description: 'Doğrulanmış sunucu',
    },
    {
        id: 'streamer',
        label: 'Yayıncı',
        icon: Radio,
        color: 'text-rose-300',
        bgColor: '',
        condition: (s) => s.badges?.includes('streamer') ?? false,
        description: 'Aktif yayıncı sunucusu',
    },
    {
        id: 'trending',
        label: 'Trend',
        icon: TrendingUp,
        color: 'text-orange-300',
        bgColor: '',
        condition: (s) => (s.weeklyHypeScore ?? 0) >= 100,
        description: 'Bu hafta trend olan sunucu',
    },
    {
        id: 'top_community',
        label: 'Top Community',
        icon: Star,
        color: 'text-yellow-300',
        bgColor: '',
        condition: (s) => s.badges?.includes('top_community') ?? false,
        description: 'En iyi topluluk sunucusu',
    },
    {
        id: 'partner',
        label: 'Partner',
        icon: Shield,
        color: 'text-blue-300',
        bgColor: '',
        condition: (s) => s.badges?.includes('partner') ?? false,
        description: 'Hypez partner sunucusu',
    },
];

export function getActiveBadges(server: Server): BadgeDef[] {
    return BADGE_DEFS.filter(b => b.condition(server));
}

export function ServerBadges({ server, className }: ServerBadgesProps) {
    const activeBadges = getActiveBadges(server);

    if (activeBadges.length === 0) return null;

    return (
        <TooltipProvider delayDuration={100}>
            <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
                {activeBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                        <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                                <div className={cn("transition-transform hover:scale-110 cursor-help", badge.color)}>
                                    <Icon className="w-5 h-5 drop-shadow-md" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-zinc-900 border-zinc-800 text-white font-semibold">
                                {badge.label}
                                <TooltipArrow className="fill-zinc-900" />
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
