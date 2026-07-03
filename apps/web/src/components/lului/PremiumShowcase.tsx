"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ShineBorder } from "@/components/lului/BorderShine";
import { motion } from "framer-motion";
import { Server } from "@/lib/api";
import { Crown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

const MotionLink = motion.create(Link);

interface PremiumShowcaseProps {
    servers: Server[];
}

const ITEMS_PER_PAGE = 4;
const MIN_ITEMS = 8;
const MAX_ITEMS = 15;

export function PremiumShowcase({ servers }: PremiumShowcaseProps) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    const premiumServers = servers.filter(
        (s) => s.premiumTier === 'PREMIUM'
    );

    type ShowcaseItem = Server | { isAd: true; id: string };

    const capped = premiumServers.slice(0, MAX_ITEMS);
    const finalPool: ShowcaseItem[] = [...capped];

    if (finalPool.length < MIN_ITEMS) {
        const needed = MIN_ITEMS - finalPool.length;
        for (let i = 0; i < needed; i++) {
            finalPool.push({ isAd: true, id: `ad-${i}` });
        }
    }

    const totalPages = Math.ceil(finalPool.length / ITEMS_PER_PAGE);

    // Auto-play — smooth, no arrows needed
    useEffect(() => {
        if (totalPages <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalPages);
        }, 5000);
        return () => clearInterval(timer);
    }, [totalPages]);

    const currentItemsStart = currentIndex * ITEMS_PER_PAGE;
    const displayServers = finalPool.slice(currentItemsStart, currentItemsStart + ITEMS_PER_PAGE);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 mb-12">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-2xl pb-1">
                    {t("home.premium.title")}
                </h2>

                {/* Dots */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500 cursor-pointer",
                                    idx === currentIndex
                                        ? "w-8 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        : "w-1.5 bg-white/10 hover:bg-white/20"
                                )}
                                onClick={() => setCurrentIndex(idx)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Cards — smooth crossfade */}
            <div className="overflow-hidden">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {displayServers.map((item, cardIdx) => {
                        const isPriority = currentIndex === 0 && cardIdx < 2;
                        if ('isAd' in item && item.isAd) {
                            return (
                                <MotionLink
                                    key={item.id}
                                    href="/premium"
                                    className="group relative block w-full h-[200px]"
                                >
                                    <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808] border border-white/5 flex flex-col items-center justify-center text-center p-4">
                                        <div className="z-10 flex flex-col items-center gap-2">
                                            <Crown className="w-8 h-8 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                                            <h3 className="font-bold text-zinc-400 group-hover:text-white transition-colors">
                                                {t("home.boostAd.advertiseHere")}
                                            </h3>
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                                                {t("home.boostAd.cta")}
                                            </p>
                                        </div>
                                        <ShineBorder className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-50" shineColor={["#71717a", "#27272a"]} />
                                    </div>
                                </MotionLink>
                            );
                        }

                        const server = item as Server;

                        return (
                            <MotionLink
                                key={server.id}
                                href={`/servers/${server.id}`}
                                className="group relative block w-full h-[200px]"
                            >
                                <div className="relative h-full rounded-2xl overflow-hidden bg-[#111214] border border-white/5 transition-all duration-300">

                                    <ShineBorder
                                        className="absolute inset-0 pointer-events-none"
                                        shineColor={["#38bdf8", "#0ea5e9"]}
                                        borderWidth={2}
                                        duration={8}
                                    />

                                    {/* Banner (Top 50%) */}
                                    <div className="absolute top-0 w-full h-[50%] overflow-hidden z-0">
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={server.banner || "/assets/DefaultBanner.png"}
                                                alt={server.name}
                                                fill
                                                quality={75}
                                                className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                priority={isPriority}
                                                unoptimized={server.banner ? (server.banner.includes("/a_") || server.banner.includes(".gif")) : false}
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#111214]" />

                                        {/* Badge */}
                                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg z-10 bg-sky-500 text-black flex items-center gap-1">
                                            <Crown className="w-2.5 h-2.5" />
                                            PREMIUM
                                        </div>
                                    </div>

                                    {/* Content (Bottom 50%) */}
                                    <div className="absolute bottom-0 w-full h-[50%] bg-gradient-to-b from-[#070707]/10 via-[#050505] to-[#030303] px-4 pb-3 flex flex-col justify-end z-10">
                                        {/* Icon */}
                                        <div className="absolute -top-6 left-4 w-12 h-12 rounded-[14px] bg-gradient-to-b from-[#070707]/10 via-[#050505] to-[#030303] p-1 shadow-lg">
                                            <div className="w-full h-full rounded-[10px] overflow-hidden bg-zinc-800 relative">
                                                {server.icon ? (
                                                    <DiscordIcon iconUrl={server.icon} name={server.name} cdnSize={64} width={64} height={64} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">{server.name.charAt(0)}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between mt-6">
                                            <h3 className="font-bold text-white text-sm truncate max-w-[65%] leading-none" title={server.name}>
                                                {server.name}
                                            </h3>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                                                {server.categories?.[0] || "COMMUNITY"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </MotionLink>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
