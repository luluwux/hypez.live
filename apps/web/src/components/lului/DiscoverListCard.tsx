import React from "react";
import { Server } from "@/lib/api";
import { Users, Star, Zap, Mic, Flame, Skull } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { ShineBorder } from "@/components/lului/BorderShine";
import { BorderBeam } from "@/components/lului/BorderBeam";
import { motion } from "framer-motion";
import type { SortOption } from "@/hooks/useDiscoverFiltering";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

interface DiscoverListCardProps {
    server: Server;
    sortBy?: SortOption;
    isPriority?: boolean;
}

const DotIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 10 10" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="5" />
    </svg>
);

function getMetrics(s: Server, sortBy: SortOption | undefined, t: any) {
    const members = { icon: Users, value: (s.memberCount ?? 0).toLocaleString(), label: t('server.stats.members'), color: "text-zinc-400" };
    const online = { icon: DotIcon, value: (s.activeMemberCount ?? 0).toLocaleString(), label: t('server.stats.onlineMembers'), color: "text-green-500" };

    let third: { icon: any; value: string; label: string; color: string };
    switch (sortBy) {
        case 'hype':
            third = { icon: Flame, value: Math.round(s.weeklyHypeScore ?? 0).toLocaleString(), label: 'Hype', color: "text-orange-400" };
            break;
        case 'voice':
            third = { icon: Mic, value: (s.voiceMemberCount ?? 0).toLocaleString(), label: t('server.stats.voice'), color: "text-cyan-400" };
            break;
        case 'boost':
            third = { icon: Zap, value: (s.boostCount ?? 0).toLocaleString(), label: t('server.stats.boost'), color: "text-pink-400" };
            break;
        case 'votes':
            third = { icon: Star, value: (s.votes ?? 0).toLocaleString(), label: t('server.stats.totalVotes'), color: "text-yellow-400" };
            break;
        case 'discover':
            third = { icon: Star, value: (s.votes ?? 0).toLocaleString(), label: t('server.stats.totalVotes'), color: "text-yellow-400" };
            break;
        default:
            third = { icon: Users, value: (s.memberCount ?? 0).toLocaleString(), label: 'Total', color: "text-zinc-400" };
    }

    return [members, online, third];
}

export function DiscoverListCard({ server: s, sortBy, isPriority = false }: DiscoverListCardProps) {
    const { t } = useTranslation();
    const isPremium = s.premiumTier === 'PREMIUM';
    const isToken = s.isToken === true;
    const router = useRouter();
    const metrics = getMetrics(s, sortBy, t);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
        >
            <div
                className="group relative w-full bg-[#050505] rounded-[24px] overflow-hidden hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 border border-white/5 flex flex-col md:flex-row hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(`/servers/${s.id}`)}
            >

                {/* BANNER & ICON */}
                <div className="relative w-full md:w-[240px] h-[120px] md:h-auto shrink-0 bg-[#111214] flex items-center justify-center overflow-hidden">
                    <>
                        <Image
                            src={s.banner ? (s.banner.includes("discordapp") || s.banner.includes("discord.com") ? `${s.banner.replace(/[?&]size=\d+/, '')}?size=1024` : s.banner) : "/assets/DefaultBanner.png"}
                            alt={s.name}
                            fill
                            quality={85}
                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 md:opacity-100"
                            sizes="(max-width: 768px) 100vw, 240px"
                            priority={isPriority}
                            unoptimized={s.banner ? (s.banner.includes("/a_") || s.banner.includes(".gif")) : false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050505] hidden md:block" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent md:hidden" />
                    </>

                    {/* Icon Container */}
                    <div className={cn(
                        "relative z-10 w-20 h-20 rounded-[20px] p-1 bg-[#050505] shadow-xl md:-mr-[40px] md:translate-x-[40px]",
                        isPremium && "bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_20px_-5px_theme(colors.blue.500/0.4)]"
                    )}>
                        <div className="w-full h-full rounded-[16px] overflow-hidden bg-zinc-800 relative">
                            {s.icon ? (
                                <DiscordIcon
                                    iconUrl={s.icon}
                                    name={s.name}
                                    cdnSize={128}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-600">
                                    {s.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 p-5 md:pl-16 flex flex-col justify-center">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors truncate">
                                    {s.name}
                                </h3>
                                {(isPremium || isToken) && (
                                    <div className="flex gap-2 shrink-0">
                                        {isPremium && <PremiumBadge tier="PREMIUM" />}
                                        {isToken && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600 text-black shadow-lg">
                                                <Skull className="w-3 h-3 text-black" />
                                                TOKEN
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4 font-medium">
                                {s.description || t('discover.card.noDescription')}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {s.categories && s.categories.map((cat, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#1e1f22] text-zinc-400 border border-white/5">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Stats & Action */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">

                            <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center md:justify-end">
                                {metrics.map((m, i) => (
                                    <React.Fragment key={m.label}>
                                        {i > 0 && <div className="w-px h-6 md:h-8 bg-white/5" />}
                                        <div className="flex items-center gap-1.5 text-sm font-bold">
                                            <m.icon className={cn("w-4 h-4", m.color)} />
                                            <span className="text-zinc-300">{m.value}</span>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>

                        <a
                            href={s.inviteUrl || `https://discord.com/servers/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full md:w-auto"
                            aria-label={`${t('server.header.joinServer')} ${s.name}`}
                        >
                            <Button 
                                className="w-full md:w-[120px] h-9 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all"
                                aria-label={`${t('server.header.joinServer')} ${s.name}`}
                            >
                                {t('server.header.joinServer')}
                            </Button>
                        </a>

                        </div>
                    </div>
                </div>
                {isPremium && (
                    <>
                        <ShineBorder className="absolute inset-0 pointer-events-none" shineColor={["#38bdf8", "#3b82f6"]} />
                        <BorderBeam size={250} duration={7} borderWidth={2} colorFrom="#3b82f6" colorTo="#06b6d4" />
                    </>
                )}
            </div>
        </motion.div>
    );
}
