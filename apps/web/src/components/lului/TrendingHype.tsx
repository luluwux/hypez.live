"use client";

import React, { useState } from "react";
import { Server } from "@/lib/api";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShineBorder } from "@/components/lului/BorderShine";
import { BorderBeam } from "@/components/lului/BorderBeam";
import { ArrowLeft, ArrowRight } from "@/components/ui/arrow-icons";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

const MotionDiv = motion.create("div");

interface TrendingHypeProps {
    servers: Server[];
}

const ITEMS_PER_PAGE = 4;

function HypeServerCard({ server, rank, isPriority }: { server: Server; rank: number; isPriority?: boolean }) {
    const { t } = useTranslation();
    const router = useRouter();
    const isFirst = rank === 1;
    const isSecondOrThird = rank === 2 || rank === 3;
    const isTop3 = isFirst || isSecondOrThird;

    return (
        <MotionDiv
            className="group relative block w-full h-[200px] cursor-pointer"
            onClick={() => router.push(`/servers/${server.id}`)}
        >
            <div className="relative h-full rounded-2xl overflow-hidden bg-[#111214] border border-white/5 transition-all duration-300">

                {/* Banner and Content moved up, Borders moved down to render on top */}
                {/* Banner (Top 50%) */}
                <div className="absolute top-0 w-full h-[50%] overflow-hidden z-0">
                    <div className="relative w-full h-full">
                        <Image
                            src={server.banner || "/assets/DefaultBanner.png"}
                            alt={server.name}
                            fill
                            quality={75}
                            className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority={isPriority}
                            unoptimized={server.banner ? (server.banner.includes("/a_") || server.banner.includes(".gif")) : false}
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#111214]" />

                    {/* Rank (Top Left) */}
                    <div
                        className={cn(
                            "absolute top-2 left-2 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg z-10",
                            isTop3
                                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                                : "bg-white/10 text-white/70"
                        )}
                    >
                        #{rank}
                    </div>

                    {/* HOT Badge (Top Right) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-orange-500/90 text-black text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg z-10">
                        <Flame className="w-2.5 h-2.5" />
                        HOT
                    </div>
                </div>

                {/* Content (Bottom 50%) */}
                <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-b from-[#070707]/10 via-[#050505] to-[#030303] px-4 pb-3 flex flex-col justify-end z-10">
                    {/* Icon */}
                    <div className="absolute -top-6 left-4 w-12 h-12 rounded-[14px] bg-gradient-to-b from-[#070707]/10 via-[#050505] to-[#030303] p-1 shadow-lg">
                        <div className={cn(
                            "w-full h-full rounded-[10px] overflow-hidden bg-zinc-800 relative",
                            isFirst && "ring-1 ring-orange-500/50"
                        )}>
                            {server.icon ? (
                                <DiscordIcon iconUrl={server.icon} name={server.name} cdnSize={64} width={64} height={64} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-orange-400 font-bold">
                                    {server.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-end justify-between mt-6">
                        <div className="min-w-0 max-w-[65%]">
                            <h3 className="font-bold text-white text-sm truncate leading-none" title={server.name}>
                                {server.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                                <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                                <span className="text-orange-400 text-[10px] font-bold">
                                    {Math.round(server.weeklyHypeScore ?? 0).toLocaleString()} pts
                                </span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide flex-shrink-0">
                            {t('common.membersCount', { count: server.memberCount || 0 })}
                        </span>
                    </div>
                </div>

                {/* Borders (Rendered last so they stay on top of the content) */}
                {/* #1: Rotating BorderBeam (orange) */}
                {isFirst && (
                    <BorderBeam
                        className="z-20"
                        size={300}
                        duration={8}
                        borderWidth={2.5}
                        colorFrom="#f97316"
                        colorTo="#ea580c"
                        delay={0}
                    />
                )}
            </div>
        </MotionDiv>
    );
}

function EmptyHypeCard({ rank }: { rank: number }) {
    const { t } = useTranslation();
    return (
        <MotionDiv className="group relative block w-full h-[200px]">
            <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#020202] via-[#050505] to-[#070707] border border-white/5 flex flex-col items-center justify-center gap-2 text-center p-4">
                <ShineBorder
                    className="absolute inset-0 pointer-events-none opacity-30"
                    shineColor={["#71717a", "#27272a"]}
                    borderWidth={1}
                />
                <div className="z-10 flex flex-col items-center gap-2">
                    <div className="w-14 h-14 flex items-center justify-center">
                        <Flame className="w-8 h-8  text-zinc-600 group-hover:text-sky-300 transition-colors" />
                    </div>
                    <p className="font-bold text-zinc-400 group-hover:text-white transition-colors">{t('home.spotAvailable')}</p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                        {t('home.useHypeToRank')}
                    </p>
                </div>
            </div>
        </MotionDiv>
    );
}

export function TrendingHype({ servers }: TrendingHypeProps) {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(0);

    const safeServers = servers ?? [];
    const totalPages = Math.max(1, Math.ceil(Math.min(safeServers.length, 8) / ITEMS_PER_PAGE));

    // Always show section with empty cards if no servers
    const handlePrev = () => setCurrentPage((p) => (p - 1 + totalPages) % totalPages);
    const handleNext = () => setCurrentPage((p) => (p + 1) % totalPages);

    const start = currentPage * ITEMS_PER_PAGE;
    const displayServers = safeServers.slice(start, start + ITEMS_PER_PAGE);

    const slots = [
        ...displayServers,
        ...Array.from({ length: Math.max(0, ITEMS_PER_PAGE - displayServers.length) }).map(() => null as null),
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-2xl pb-2">
                        {t('home.trendingServers')}
                    </h2>

                </div>

                <div className="flex items-center gap-3">
                    {/* Page dots */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(idx)}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-500 cursor-pointer",
                                        idx === currentPage
                                            ? "w-8 bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                            : "w-1.5 bg-white/10 hover:bg-white/20"
                                    )}
                                    aria-label={`Page ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Navigation arrows */}
                    <button
                        onClick={handlePrev}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                        aria-label="Previous"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                        aria-label="Next"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Cards Grid — 4 per row with page animation */}
            <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -24 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {slots.map((server, idx) =>
                            server ? (
                                <HypeServerCard key={`${server.id}-${idx}`} server={server} rank={currentPage * ITEMS_PER_PAGE + idx + 1} isPriority={currentPage === 0 && idx < 2} />
                            ) : (
                                <EmptyHypeCard key={`empty-${idx}`} rank={currentPage * ITEMS_PER_PAGE + idx + 1} />
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
