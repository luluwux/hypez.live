"use client";

import React, { useState } from "react";
import { Server } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShineBorder } from "@/components/lului/BorderShine";
import { ArrowLeft, ArrowRight } from "@/components/ui/arrow-icons";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

const MotionDiv = motion.create("div");

interface NewlyAddedProps {
    servers: Server[];
}

const ITEMS_PER_PAGE = 4;
const MAX_SERVERS = 12;

function NewlyAddedCard({ server, isPriority }: { server: Server; isPriority?: boolean }) {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <MotionDiv
            className="group relative block w-full h-[200px] cursor-pointer"
            onClick={() => router.push(`/servers/${server.id}`)}
        >
            <div className="relative h-full rounded-2xl overflow-hidden bg-[#111214] border border-white/5 transition-all duration-300">

                <ShineBorder
                    className="absolute inset-0 pointer-events-none opacity-60"
                    shineColor={["#06b6d4", "#3b82f6"]}
                    borderWidth={2}
                    duration={10}
                />

                {/* Banner (Top 50%) */}
                <div className="absolute top-0 w-full h-[50%] overflow-hidden z-0">
                    <div className="relative w-full h-full">
                        <Image
                            src={server.banner || "/assets/DefaultBanner.png"}
                            alt={server.name}
                            fill
                            quality={75}
                            className="object-cover opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                            sizes="(max-width: 768px) 100vw, 25vw"
                            priority={isPriority}
                            unoptimized={server.banner ? (server.banner.includes("/a_") || server.banner.includes(".gif")) : false}
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#111214]" />

                    {/* NEW Badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-cyan-500/90 text-black text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg z-10">
                        <Sparkles className="w-2.5 h-2.5" />
                        NEW
                    </div>
                </div>

                {/* Content (Bottom 50%) */}
                <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-b from-[#070707]/10 via-[#050505] to-[#030303] px-4 pb-3 flex flex-col justify-end z-10">
                    {/* Icon */}
                    <div className="absolute -top-6 left-4 w-12 h-12 rounded-[14px] bg-[#111214] p-1 shadow-lg">
                        <div className="w-full h-full rounded-[10px] overflow-hidden bg-zinc-800 relative">
                            {server.icon ? (
                                <DiscordIcon iconUrl={server.icon} name={server.name} cdnSize={64} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold">
                                    {server.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-end justify-between mt-6">
                        <div className="min-w-0 max-w-[70%]">
                            <h3 className="font-bold text-white text-sm truncate leading-none" title={server.name}>
                                {server.name}
                            </h3>
                            <p className="text-zinc-500 text-[10px] mt-1">
                                {t('common.membersCount', { count: server.memberCount || 0 })}
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide flex-shrink-0">
                            {server.categories?.[0] || "COMMUNITY"}
                        </span>
                    </div>
                </div>
            </div>
        </MotionDiv>
    );
}

function EmptyNewlyCard() {
    return (
        <MotionDiv className="group relative block w-full h-[200px]">
            <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808] border border-white/5 flex flex-col items-center justify-center gap-2 text-center p-4">
                <ShineBorder
                    className="absolute inset-0 pointer-events-none opacity-20"
                     shineColor={["#71717a", "#27272a"]}
                    borderWidth={1}
                />
                <div className="z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8  text-zinc-600 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    <p className="font-bold text-zinc-400 group-hover:text-white transition-colors">Coming Soon</p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                        Add your server now
                    </p>
                </div>
            </div>
        </MotionDiv>
    );
}

export function NewlyAdded({ servers }: NewlyAddedProps) {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(0);

    const safeServers = servers ?? [];
    const totalItems = Math.min(safeServers.length, MAX_SERVERS);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (safeServers.length === 0) return null;

    const handlePrev = () => setCurrentPage((p) => (p - 1 + totalPages) % totalPages);
    const handleNext = () => setCurrentPage((p) => (p + 1) % totalPages);

    const start = currentPage * ITEMS_PER_PAGE;
    const displayServers = safeServers.slice(start, start + ITEMS_PER_PAGE);

    // Fill empty slots
    const slots = [
        ...displayServers,
        ...Array.from({ length: Math.max(0, ITEMS_PER_PAGE - displayServers.length) }).map(() => null as null),
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-sky-300 drop-shadow-2xl">
                    {t('home.newlyAdded')}
                </h2>

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
                                            ? "w-8 bg-gradient-to-r from-cyan-500 to-sky-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
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
                        disabled={totalPages <= 1}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Previous"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={totalPages <= 1}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Next"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Cards Grid — 4 per row */}
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
                                <NewlyAddedCard key={`${server.id}-${idx}`} server={server} isPriority={currentPage === 0 && idx < 2} />
                            ) : (
                                <EmptyNewlyCard key={`empty-${idx}`} />
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
