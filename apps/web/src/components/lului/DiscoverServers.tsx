"use client";

import { useTranslation } from "@/lib/i18n/hooks";
import { Server } from "@/lib/api";
import { useRouter } from "next/navigation";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/lului/BorderBeam";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { DiscordIcon } from "@/components/shared/DiscordIcon";
import { BoostServerAd } from "@/components/shared/BoostServerAd";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const MotionDiv = motion.div;

interface DiscoverServersProps {
    selectedCategoryProp?: string;
    onCategoryChange?: (category: string) => void;
    initialServers?: Server[];
}

// Shuffle helper
function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = copy[i]!;
        copy[i] = copy[j]!;
        copy[j] = tmp;
    }
    return copy;
}

type DiscoverItem = Server | { isAd: true; id: string };

export function DiscoverServers({ selectedCategoryProp, onCategoryChange, initialServers = [] }: DiscoverServersProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [internalCategory, setInternalCategory] = useState("all");
    const selectedCategory = selectedCategoryProp !== undefined ? selectedCategoryProp : internalCategory;
    const [mounted, setMounted] = useState(false);
    const [bannerErrors, setBannerErrors] = useState<Set<string>>(new Set());

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleBannerError = (serverId: string) => {
        setBannerErrors(prev => { const next = new Set(prev); next.add(serverId); return next; });
    };

    const handleCategoryChange = (val: string) => {
        if (selectedCategoryProp === undefined) {
            setInternalCategory(val);
        }
        onCategoryChange?.(val);
    };

    // Build display list with position-based logic.
    // Shuffling is deferred to after hydration (mounted=true) to prevent SSR/client mismatch
    // caused by Math.random() producing different sequences on server vs. client.
    const displayItems: DiscoverItem[] = useMemo(() => {
        const premiumServers = initialServers.filter(s => s.premiumTier === 'PREMIUM');
        const normalServers = initialServers.filter(s => s.premiumTier !== 'PREMIUM');

        const result: (DiscoverItem | null)[] = new Array(12).fill(null);

        // Position 0 (1st): Premium server — only shuffle after mount
        if (premiumServers.length > 0) {
            const orderedPremium = mounted ? shuffle(premiumServers) : premiumServers;
            const first = orderedPremium[0];
            if (first) result[0] = first;
        }

        // Position 8 (9th): Always ad
        result[8] = { isAd: true, id: `ad-discover` };

        // Fill remaining positions — only shuffle after mount
        const orderedNormal = mounted ? shuffle(normalServers) : normalServers;
        let normalIdx = 0;

        for (let i = 0; i < 12; i++) {
            if (result[i] !== null) continue;
            if (normalIdx < orderedNormal.length) {
                const item = orderedNormal[normalIdx++];
                if (item) result[i] = item;
            }
        }

        return result.filter(Boolean) as DiscoverItem[];
    }, [initialServers, mounted]);

    return (
        <div id="discover" className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-2xl pb-1">
                    {t("home.discover.title")}
                </h2>

                <Link
                    href="/servers"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium group"
                >
                    {t("home.discover.more")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* --- GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[500px] mb-12">
                {displayItems.map((item, idx) => {
                    if ('isAd' in item && item.isAd) {
                        return (
                            <MotionDiv
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <BoostServerAd variant="card" />
                            </MotionDiv>
                        );
                    }

                    const s = item as Server;
                    const isPremium = s.premiumTier === 'PREMIUM';
                    const isToken = s.isToken === true;

                    return (
                        <MotionDiv
                            key={s.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <div
                                className="group relative w-full h-[340px] bg-zinc-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-black/70"
                                onClick={() => router.push(`/servers/${s.id}`)}
                            >
                                {/* Banner / Background */}
                                <div className="absolute inset-x-0 top-0 h-[150px] overflow-hidden">
                                    {(isPremium || isToken) && (
                                        <div className="absolute top-3 right-3 z-20 flex gap-2">
                                            {isPremium && <PremiumBadge tier="PREMIUM" />}
                                            {isToken && (
                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500/90 text-white shadow-lg">
                                                    TOKEN
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="w-full h-full relative">
                                        <Image
                                            src={(s.banner && mounted && !bannerErrors.has(s.id)) ? s.banner : "/assets/DefaultBanner.png"}
                                            alt={s.name}
                                            fill
                                            quality={75}
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            priority={idx < 3}
                                            onError={() => handleBannerError(s.id)}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-transparent to-transparent" />
                                    </div>
                                </div>

                                {/* Dark Content */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[#020202] via-[#040404] to-[#080808] rounded-t-[24px] px-5 pb-5 pt-0 min-h-[220px] flex flex-col border-t border-white/10">
                                    {/* Icon */}
                                    <div className="-mt-8 mb-2">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[18px] p-1 bg-[#111214]",
                                            isPremium && "bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_20px_-5px_theme(colors.blue.500/0.4)]"
                                        )}>
                                            <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#1e1f22] relative">
                                                {s.icon ? (
                                                    <DiscordIcon
                                                        iconUrl={s.icon}
                                                        name={s.name}
                                                        cdnSize={64}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                        priority={idx < 3}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-600">
                                                        {s.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Name & Stats */}
                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                        <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1 flex-1" title={s.name}>
                                            {s.name}
                                        </h3>

                                        <div className="flex items-center gap-3 text-[11px] font-semibold bg-[#1e1f22] px-3 py-1.5 rounded-full border border-white/5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <Users className="w-3 h-3" />
                                                {s.memberCount}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-green-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                {s.activeMemberCount || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed mb-auto font-medium">
                                        {s.description || "This server doesn't have a description yet. We're sure it's an amazing place!"}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center mt-auto pt-4 border-t border-white/5">
                                        <div className="flex flex-wrap gap-2">
                                            {s.categories && s.categories.length > 0 && (
                                                <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#1e1f22] text-zinc-400 border border-white/5">
                                                    {s.categories[0]}
                                                </span>
                                            )}
                                            {s.categories && s.categories.length > 1 && (
                                                <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#1e1f22] text-zinc-400 border border-white/5">
                                                    +{s.categories.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Effects — Premium rotating BorderBeam */}
                                {isPremium && <BorderBeam size={300} duration={10} delay={9} borderWidth={3} colorFrom="#38bdf8" colorTo="#3b82f6" />}
                            </div>
                        </MotionDiv>
                    );
                })}
            </div>
        </div>
    );
}
