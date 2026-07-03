import React from "react";
import { Server } from "@/lib/api";
import { Users, Star, Zap, Mic, Flame, Skull } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { ShineBorder } from "@/components/lului/BorderShine";
import { BorderBeam } from "@/components/lului/BorderBeam";
import { motion } from "framer-motion";
import type { SortOption } from "@/hooks/useDiscoverFiltering";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

interface DiscoverGridCardProps {
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

export function DiscoverGridCard({ server: s, sortBy, isPriority = false }: DiscoverGridCardProps) {
    const { t } = useTranslation();
    const isPremium = s.premiumTier === 'PREMIUM';
    const isToken = s.isToken === true;
    const router = useRouter();
    const metrics = getMetrics(s, sortBy, t);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <div
                className="group relative w-full h-[340px] bg-zinc-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(`/servers/${s.id}`)}
            >
                {/* Banner / Background */}
                <div className="absolute inset-x-0 top-0 h-[150px] overflow-hidden">
                    {(isPremium || isToken) && (
                        <div className="absolute top-3 right-3 z-20 flex gap-2">
                            {isPremium && <PremiumBadge tier="PREMIUM" />}
                            {isToken && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600 text-black shadow-lg">
                                    <Skull className="w-3 h-3 text-black" />
                                    TOKEN
                                </span>
                            )}
                        </div>
                    )}
                    <div className="w-full h-full relative">
                        <Image
                            src={s.banner ? (s.banner.includes("discordapp") || s.banner.includes("discord.com") ? `${s.banner.replace(/[?&]size=\d+/, '')}?size=1024` : s.banner) : "/assets/DefaultBanner.png"}
                            alt={s.name}
                            fill
                            quality={85}
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={isPriority}
                            unoptimized={s.banner ? (s.banner.includes("/a_") || s.banner.includes(".gif")) : false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070707]/10 via-transparent to-transparent" />
                    </div>
                </div>

                {/* Dark Content Div */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#050505] rounded-t-[24px] px-5 pb-5 pt-0 min-h-[220px] flex flex-col border-t border-white/5">
                    {/* Icon */}
                    <div className="-mt-8 mb-2">
                        <div className={cn(
                            "w-16 h-16 rounded-[18px] p-1 bg-[#050505] shadow-lg",
                            isPremium && "bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_20px_-5px_theme(colors.blue.500/0.4)]"
                        )}>
                            <div className="w-full h-full rounded-[14px] overflow-hidden bg-zinc-800 relative">
                                {s.icon ? (
                                    <DiscordIcon
                                        iconUrl={s.icon}
                                        name={s.name}
                                        cdnSize={64}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-600">
                                        {s.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                        <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1 flex-1" title={s.name}>
                            {s.name}
                        </h3>

                        {/* Dynamic 3-metric stats */}
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-[#1e1f22] px-2 py-1 rounded-lg border border-white/5 whitespace-nowrap flex-shrink-0">
                            {metrics.map((m, i) => (
                                <React.Fragment key={m.label}>
                                    {i > 0 && <div className="w-px h-3 bg-white/10" />}
                                    <div className="flex items-center gap-1" title={m.label}>
                                        <m.icon className={cn("w-3 h-3", m.color)} />
                                        <span className="text-zinc-300">{m.value}</span>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed mb-auto font-medium">
                        {s.description || t('discover.card.noDescription')}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                            {s.categories && s.categories.slice(0, 1).map((cat, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#1e1f22] text-zinc-400 border border-white/5">
                                    {cat}
                                </span>
                            ))}
                        </div>

                        <a
                            href={s.inviteUrl || `https://discord.com/servers/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${t('server.header.joinServer')} ${s.name}`}
                        >
                            <Button 
                                size="sm" 
                                className="h-7 px-5 bg-[#1e1f22] hover:bg-white text-white hover:text-black border border-white/5 rounded-full text-[11px] font-bold transition-all"
                                aria-label={`${t('server.header.joinServer')} ${s.name}`}
                            >
                                {t('server.header.joinServer')}
                            </Button>
                        </a>
                    </div>
                </div>
                {isPremium && (
                    <>
                        <BorderBeam size={200} duration={6} borderWidth={2} colorFrom="#3b82f6" colorTo="#06b6d4" />
                    </>
                )}
            </div>
        </motion.div>
    );
}
