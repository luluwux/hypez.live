"use client";

import React, { useEffect, useState } from "react";
import { Server, api } from "@/lib/api";
import { Flame, Star, Mic, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GradientText } from "@/components/ui/GradientText";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

interface TopListColumnProps {
    title: string;
    icon: React.ReactNode;
    servers: Server[];
    sortKey: "votes" | "voiceMemberCount" | "weeklyHypeScore";
    viewAllHref: string;
    loading: boolean;
}

function TopListColumn({ title, icon, servers, sortKey, viewAllHref, loading }: TopListColumnProps) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col bg-gradient-to-b from-[#020202] via-[#040404] to-[#070707] border border-white/5 rounded-2xl p-5">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-bold text-white text-sm">{title}</h3>
                </div>
                <Link
                    href={viewAllHref}
                    className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors text-xs group"
                >
                    {t("home.leaderboards.viewAll")}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* List */}
            <div className="flex flex-col">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 animate-pulse border-b border-white/[0.03] last:border-b-0">
                            <div className="w-4 text-center flex-shrink-0 h-3 bg-zinc-800 rounded" />
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex-shrink-0" />
                            <div className="flex-1 h-3 bg-zinc-800 rounded" />
                            <div className="w-12 h-3 bg-zinc-800 rounded" />
                        </div>
                    ))
                    : servers.map((server, idx) => (
                        <Link
                            key={server.id}
                            href={`/servers/${server.id}`}
                            className="flex items-center gap-3 py-2.5 hover:bg-white/[0.03] rounded-lg hover:rounded-lg transition-all group/item border-b border-white/[0.03] last:border-b-0"
                        >
                            {/* Rank — plain number, no background */}
                            <span className={cn(
                                "text-sm font-bold flex-shrink-0 text-center min-w-[16px]",
                                idx === 0 ? "text-amber-400" :
                                    idx === 1 ? "text-zinc-400" :
                                        idx === 2 ? "text-amber-600" :
                                            "text-zinc-600"
                            )}>
                                {idx + 1}
                            </span>

                            {/* Icon — no background */}
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                {server.icon ? (
                                    <DiscordIcon
                                        iconUrl={server.icon}
                                        name={server.name}
                                        cdnSize={64}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-sm">
                                        {server.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <span className="flex-1 text-sm truncate group-hover/item:text-white transition-colors">
                                {server.premiumTier === 'PREMIUM' ? (
                                    <GradientText
                                        colors={[
                                            "#ffffff",
                                            "#f0f9ff",
                                            "#bae6fd",
                                            "#7dd3fc",
                                            "#38bdf8",
                                            "#7dd3fc",
                                            "#bae6fd",
                                            "#f0f9ff",
                                            "#ffffff",
                                        ]}
                                        animationSpeed={8}
                                        className="text-sm"
                                    >
                                        {server.name}
                                    </GradientText>
                                ) : (
                                    <span className="text-zinc-300">{server.name}</span>
                                )}
                            </span>

                            {/* Score */}
                            <span className="text-xs font-bold text-zinc-500 flex-shrink-0">
                                {sortKey === "weeklyHypeScore"
                                    ? `${Math.round((server.weeklyHypeScore ?? 0)).toLocaleString()} pts`
                                    : sortKey === "voiceMemberCount"
                                        ? `${(server.voiceMemberCount ?? 0).toLocaleString()}`
                                        : `${(server.votes ?? 0).toLocaleString()} votes`
                                }
                            </span>
                        </Link>
                    ))}
            </div>
        </div>
    );
}

export function TopLists() {
    const { t } = useTranslation();
    const [votedServers, setVotedServers] = useState<Server[]>([]);
    const [voiceServers, setVoiceServers] = useState<Server[]>([]);
    const [hypeServers, setHypeServers] = useState<Server[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.findServers({ sort: "votes", limit: 10, ignorePremiumBoost: true }).then(r => r.data),
            api.findServers({ sort: "voice", limit: 10, ignorePremiumBoost: true }).then(r => r.data),
            api.getTrendingHype(10),
        ])
            .then(([voted, voice, hype]) => {
                setVotedServers(voted);
                setVoiceServers(voice);
                setHypeServers(hype);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-16 pb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-sky-300 drop-shadow-2xl">
                    {t("home.leaderboards.title")}
                </h2>
            </div>

            {/* 3 Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TopListColumn
                    title={t("home.leaderboards.mostVoted")}
                    icon={<Star className="w-4 h-4 text-sky-300" />}
                    servers={votedServers}
                    sortKey="votes"
                    viewAllHref="/top?sort=votes"
                    loading={loading}
                />
                <TopListColumn
                    title={t("home.leaderboards.mostVoice")}
                    icon={<Mic className="w-4 h-4 text-sky-300" />}
                    servers={voiceServers}
                    sortKey="voiceMemberCount"
                    viewAllHref="/top?sort=voice"
                    loading={loading}
                />
                <TopListColumn
                    title={t("home.leaderboards.mostHype")}
                    icon={<Flame className="w-4 h-4 text-sky-300" />}
                    servers={hypeServers}
                    sortKey="weeklyHypeScore"
                    viewAllHref="/top"
                    loading={loading}
                />
            </div>
        </div>
    );
}
