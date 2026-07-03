"use client";

import { Hash, Shield, Zap, LucideIcon, Calendar, Trophy, User, FolderTree, Crown, Mic, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Server } from "@/lib/api";
import { BoostServerAd } from "@/components/shared/BoostServerAd";
import { useTranslation } from "@/lib/i18n/hooks";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";

const DotIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 10 10" className={cn("text-zinc-400 fill-current", className)} xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="5" />
    </svg>
);

const CARD_GRADIENT = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";

const StatCard = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) => (
    <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-white/10 transition-colors h-full")}>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-zinc-300">{label}</span>
        </div>
        <div key={String(value)} className="text-2xl font-bold text-white tracking-tight animate-in fade-in zoom-in duration-300">
            {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
    </div>
);

const InfoRow = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <span className="text-zinc-300 text-sm font-medium">{label}</span>
        <span className="text-white text-sm font-semibold">{value}</span>
    </div>
);

function VoterRowInner({ rank, username, voteCount, votesLabel, avatarUrl }: { rank: number, username: string, voteCount: number, votesLabel: string, avatarUrl?: string | null }) {
    return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                rank === 1 ? "bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/30" :
                rank === 2 ? "bg-zinc-300/20 text-zinc-200 ring-1 ring-zinc-300/30" :
                rank === 3 ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30" :
                "bg-zinc-800 text-zinc-300"
            )}>
                {rank <= 3 ? <Trophy className="w-3.5 h-3.5" aria-hidden="true" /> : rank}
            </div>
            <div className="flex items-center gap-2">
                {avatarUrl ? (
                    <Image src={avatarUrl} alt={username} width={20} height={20} className="w-5 h-5 rounded-full" unoptimized />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                        <User className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                    </div>
                )}
                <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{username}</span>
            </div>
        </div>
        <div className="text-xs font-bold text-zinc-400">{voteCount} {votesLabel}</div>
    </div>
    );
}

interface ServerOverviewProps {
    server: Server;
}

export function ServerOverview({ server }: ServerOverviewProps) {
    const { t, language } = useTranslation();
    const [liveVotes, setLiveVotes] = useState(server.votes ?? 0);
    const [liveHype, setLiveHype] = useState(Math.round(server.weeklyHypeScore ?? 0));

    useSocket({
        serverId: server.id,
        onVote: (data) => setLiveVotes(data.votes),
        onHype: (data) => setLiveHype((prev) => prev + data.pointsAwarded)
    });

    const creationDate = server.createdAt
        ? new Date(server.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    const verificationLevel = server.badges?.includes('verified')
        ? t('server.info.verified')
        : t('server.info.standard');

    const topVoters = server.topVoters || [];

    return (
        <div className="flex flex-col gap-4 mt-8">
            {/* ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">
                {/* STAT GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard label={t('server.stats.members')} value={server.memberCount} icon={Hash} />
                    <StatCard label={t('server.stats.onlineMembers')} value={server.activeMemberCount ?? 0} icon={DotIcon} />
                    <StatCard label={t('server.stats.voice')} value={server.voiceMemberCount ?? 0} icon={Mic} />
                    <StatCard label={t('server.stats.totalVotes')} value={liveVotes} icon={Star} />
                    <StatCard label="Hype" value={liveHype} icon={Flame} />
                    <StatCard label="Boost" value={server.boostCount ?? 0} icon={Zap} />
                </div>

                {/* RIGHT: Categories */}
                <div className="p-2">
                    <h3 className="text-lg font-bold text-white mb-4 px-1">{t('server.categories.title')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {server.categories && server.categories.length > 0 ? (
                            server.categories.map(tag => (
                                <span key={tag} className="px-3 py-1.5 rounded-lg bg-[#18191b] border border-white/5 text-xs font-medium text-zinc-400 hover:text-white hover:border-blue-500/30 transition-colors cursor-pointer">
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-zinc-500 text-sm px-1">{t('server.categories.empty')}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">
                {/* LEFT: INFO & TOP VOTERS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Server Info */}
                    <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-6 h-full flex flex-col")}>
                        <h3 className="text-lg font-bold text-white mb-4">{t('server.info.title')}</h3>
                        <div className="space-y-1 flex-1">
                            <InfoRow label={t('server.info.verification')} value={verificationLevel} />
                            <InfoRow label={t('server.info.memberCount')} value={server.memberCount?.toLocaleString()} />
                            <InfoRow label={t('server.info.roleCount')} value={(server.roleCount ?? 0).toLocaleString()} />
                            <InfoRow label={t('server.info.channelCount')} value={(server.channelCount ?? 0).toLocaleString()} />
                            <InfoRow label="Boost" value={(server.boostCount ?? 0).toLocaleString()} />
                            {server.voiceMemberCount != null && (
                                <InfoRow label={t('server.info.voiceOnline')} value={server.voiceMemberCount.toLocaleString()} />
                            )}
                            <InfoRow label={t('server.info.createdAt')} value={creationDate} />
                            {server.locale && (
                                <InfoRow label={t('server.info.language')} value={server.locale} />
                            )}
                        </div>
                    </div>

                    {/* Top Voters */}
                    <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-6 h-full flex flex-col")}>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            {t('server.topVoters.title')}
                        </h3>
                        <div className="space-y-1 flex-1">
                            {topVoters.length > 0 ? (
                                topVoters.slice(0, 5).map((voter, i) => {
                                    const userObj = (voter as any).user || {};
                                    const displayUsername = userObj.username || userObj.global_name || userObj.name || voter.username;
                                    
                                    // Handle Discord avatar URL format if available
                                    let displayAvatar = userObj.avatarUrl || userObj.avatar || userObj.image || voter.avatarUrl;
                                    if (userObj.id && userObj.avatar && !displayAvatar?.startsWith('http')) {
                                        displayAvatar = `https://cdn.discordapp.com/avatars/${userObj.id}/${userObj.avatar}.png`;
                                    }

                                    return (
                                        <VoterRowInner
                                            key={voter.userId}
                                            rank={i + 1}
                                            username={displayUsername}
                                            voteCount={voter.voteCount}
                                            votesLabel={t('server.topVoters.votes')}
                                            avatarUrl={displayAvatar}
                                        />
                                    );
                                })
                            ) : (
                                <div className="flex items-center justify-center flex-1 text-zinc-500 text-sm">
                                    {t('server.topVoters.empty')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: OWNER & AD */}
                <div className="flex flex-col gap-8 w-full justify-between">
                    {/* Server Owner */}
                    <div className="relative border border-white/5 rounded-2xl p-5 overflow-hidden flex items-center justify-between group h-[90px]">
                        <>
                            <Image src={server.banner || "/assets/DefaultBanner.png"} alt="Banner" fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500" sizes="300px" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
                        </>
                        <div className="relative z-10 flex items-center gap-4">
                            {(() => {
                                const ownerObj = (server as any).owner || (server as any).creator || {};
                                const ownerName = ownerObj.username || ownerObj.global_name || ownerObj.name || "Gizli Kullanıcı";
                                
                                let ownerAvatar = ownerObj.avatarUrl || ownerObj.avatar || ownerObj.image;
                                if (ownerObj.id && ownerObj.avatar && !ownerAvatar?.startsWith('http')) {
                                    ownerAvatar = `https://cdn.discordapp.com/avatars/${ownerObj.id}/${ownerObj.avatar}.png`;
                                }

                                return (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10 shadow-xl overflow-hidden">
                                            {ownerAvatar ? (
                                                <Image src={ownerAvatar} alt={ownerName} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                            ) : (
                                                <Crown className="w-5 h-5 text-yellow-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5 drop-shadow-md">{t('server.info.owner')}</div>
                                            <div className="text-sm font-bold text-white drop-shadow-md">
                                                {ownerName}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Premium Ad Banner */}
                    <div className="mt-auto">
                        <BoostServerAd variant="banner" />
                    </div>
                </div>
            </div>
        </div>
    );
}
