import { ShineBorder } from "@/components/lului/BorderShine";
import { cn } from "@/lib/utils";
import { Users, Star, Mic, Zap, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/GradientText";

import { Server } from "@/lib/api";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

interface ServerListItemProps {
    server: Server;
    rank: number;
    activeSort: string;
}

export function ServerListItem({ server, rank, activeSort }: ServerListItemProps) {
    const getMetric = () => {
        switch (activeSort) {
            case "hype":
                return { icon: Flame, value: Math.round(server.weeklyHypeScore ?? 0).toLocaleString(), color: "text-zinc-400", label: "Hype Score" };
            case "votes":
                return { icon: Star, value: (server.votes ?? 0).toLocaleString(), color: "text-zinc-400", label: "Votes" };
            case "members":
                return { icon: Users, value: (server.memberCount ?? 0).toLocaleString(), color: "text-zinc-400", label: "Members" };
            case "voice":
                return { icon: Mic, value: (server.voiceMemberCount ?? 0).toLocaleString(), color: "text-zinc-400", label: "Voice" };
            case "boost":
                return { icon: Zap, value: (server.boostCount ?? 0).toLocaleString(), color: "text-zinc-400", label: "Boosts" };
            default:
                return { icon: Flame, value: Math.round(server.weeklyHypeScore ?? 0).toLocaleString(), color: "text-zinc-400", label: "Hype Score" };
        }
    };

    const metric = getMetric();
    const MetricIcon = metric.icon;
    const isPremium = server.premiumTier === 'PREMIUM';

    let shineColor: string[] | null = null;

    if (rank === 1) {
        shineColor = ["#FFE000", "#FFD700", "#F59E0B"]; // Gold / Altın
    } else if (rank === 2) {
        shineColor = ["#A1A1AA", "#71717A", "#4B5563"]; // Iron / Demir
    } else if (rank === 3) {
        shineColor = ["#CD7F32", "#B45309", "#8C5845"]; // Bronze / Bronz
    }

    const Content = () => (
        <>
            {/* Rank */}
            <div className="flex-shrink-0 w-10 flex justify-center z-10">
                <span className={cn(
                    "font-bold text-lg",
                    rank === 1 ? "text-[#FFD700]" :
                        rank === 2 ? "text-[#A1A1AA]" :
                            rank === 3 ? "text-[#CD7F32]" :
                                "text-zinc-600"
                )}>
                    #{rank}
                </span>
            </div>

            {/* Icon */}
            <div className="flex-shrink-0 relative z-10">
                <div className={cn(
                    "w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform",
                    isPremium
                        ? "p-[2px] bg-gradient-to-br from-blue-400 via-white to-blue-500"
                        : "border border-white/5"
                )}>
                    <div className="w-full h-full rounded-[10px] overflow-hidden flex items-center justify-center">
                        {server.icon ? (
                            <DiscordIcon
                                iconUrl={server.icon}
                                name={server.name}
                                cdnSize={64}
                                width={54}
                                height={54}
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold text-zinc-600">
                                {server.name.charAt(0)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Name — centered, no tags */}
            <div className="flex-1 min-w-0 flex items-center gap-2 z-10">
                {isPremium ? (
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
                        className="text-base"
                    >
                        {server.name}
                    </GradientText>
                ) : (
                    <span className="text-base font-bold text-white group-hover:text-brand-400 transition-colors truncate">
                        {server.name}
                    </span>
                )}
                {isPremium && <Sparkles className="w-3.5 h-3.5 text-blue-400 fill-blue-400 flex-shrink-0" />}
            </div>

            {/* Metric */}
            <div className="flex-shrink-0 z-10 pl-4 border-l border-white/5">
                <div className="flex items-center gap-2 text-lg font-bold text-white min-w-[60px] justify-end">
                    <MetricIcon className={cn("w-5 h-5", metric.color)} />
                    {metric.value}
                </div>
            </div>
        </>
    );

    if (shineColor) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] as const }}
            >
                <Link href={`/servers/${server.id}`} className="group relative rounded-2xl p-[1px] overflow-hidden block">
                    <ShineBorder duration={10} borderWidth={1} shineColor={shineColor} />
                    <div className="relative z-10 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-b from-[#010101] via-[#040404] to-[#080808] border border-white/5 h-full w-full cursor-pointer">
                        <Content />
                    </div>
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] as const }}
        >
            <Link
                href={`/servers/${server.id}`}
                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-b from-[#010101] via-[#040404] to-[#080808] border border-white/5 hover:border-white/10 hover:from-[#050505] hover:via-[#080808] hover:to-[#0c0c0c] transition-all duration-300 block"
            >
                <Content />
            </Link>
        </motion.div>
    );
}
