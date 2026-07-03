"use client";

import { cn } from "@/lib/utils";
import type { UserProfile } from "@hypez/shared-types";
import { Shield, BadgeCheck, Clock, Crown } from "lucide-react";
import Image from "next/image";

interface UserBadgesProps {
  user: Pick<UserProfile, 'role' | 'badges' | 'premiumLevel'>;
  className?: string;
}

interface UserBadgeDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  condition: (u: Pick<UserProfile, 'role' | 'badges' | 'premiumLevel'>) => boolean;
  description: string;
}

const EarlySupporterIcon = ({ className }: { className?: string }) => (
    <Image src="/assets/badges/EarlySupporter.png" alt="Early Supporter" width={20} height={20} className={cn("object-contain scale-[1.35]", className)} unoptimized />
);

const USER_BADGE_DEFS: UserBadgeDef[] = [
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    color: 'text-red-300',
    bgColor: 'bg-red-500/15 border-red-500/30',
    condition: (u) => u.role === 'ADMIN',
    description: 'Platform administrator',
  },
  {
    id: 'verified',
    label: 'Onaylı',
    icon: BadgeCheck,
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/15 border-emerald-500/30',
    condition: (u) => u.badges?.includes('verified') ?? false,
    description: 'Verified user',
  },
  {
    id: 'early_supporter',
    label: 'Erken Destekçi',
    icon: EarlySupporterIcon,
    color: '',
    bgColor: 'bg-purple-500/15 border-purple-500/30',
    condition: (u) => u.badges?.includes('early_supporter') ?? false,
    description: 'Early supporter of the platform',
  },
  {
    id: 'premium',
    label: 'Premium',
    icon: Crown,
    color: 'text-sky-300',
    bgColor: 'bg-sky-500/15 border-sky-500/30',
    condition: (u) => u.premiumLevel > 0,
    description: 'Premium member',
  },
];

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipArrow } from "@/components/ui/tooltip";

export function getActiveUserBadges(user: Pick<UserProfile, 'role' | 'badges' | 'premiumLevel'>): UserBadgeDef[] {
  return USER_BADGE_DEFS.filter(b => b.condition(user));
}

export function UserBadges({ user, className }: UserBadgesProps) {
  const activeBadges = getActiveUserBadges(user);

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
