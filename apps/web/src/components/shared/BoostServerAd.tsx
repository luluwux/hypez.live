"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { BorderBeam } from "@/components/lului/BorderBeam";
import { ShineBorder } from "@/components/lului/BorderShine";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/hooks";

/**
 * variant="card"   → grid kartı içinde (DiscoverServers, AdBanner card)
 * variant="list"   → liste görünümünde (Discover sayfası list modu)
 * variant="banner" → server detay sayfası sağ sidebar'ı
 */
export type BoostServerAdVariant = "card" | "list" | "banner";

interface BoostServerAdProps {
    variant?: BoostServerAdVariant;
    className?: string;
    /** card/list için framer-motion layout animasyonu ekler */
    animated?: boolean;
}

function CardVariant({ className }: { className?: string }) {
    const { t } = useTranslation();
    return (
        <Link
            href="/premium"
            className={cn(
                "group relative flex flex-col items-center justify-center w-full h-[340px] rounded-3xl overflow-hidden",
                "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]",
                "border border-white/5",
                "hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer",
                className
            )}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-600/5 pointer-events-none" />

            {/* Rotating border beam */}
            <BorderBeam size={300} duration={8} delay={9} borderWidth={2} colorFrom="#38bdf8" colorTo="#3b82f6" />

            {/* Icon */}
            <div className="flex items-center justify-center text-sky-400 flex-shrink-0 mb-5">
                <Sparkles className="w-8 h-8 text-cyan-500 transition-colors" />
            </div>

            {/* Text */}
            <div className="relative z-10 text-center">
                <h3 className="font-bold text-white text-xl mb-1.5">{t("home.boostAd.title")}</h3>
                <p className="text-zinc-400 text-sm max-w-[200px]">
                    {t("home.boostAd.subtitle")}
                </p>
            </div>

            {/* CTA */}
            <div className="relative z-10 mt-6">
                <span className="inline-block bg-white text-black font-bold rounded-xl hover:bg-zinc-100 transition-all group-hover:shadow-lg px-8 py-2.5 text-sm">
                    {t("home.boostAd.cta")}
                </span>
            </div>

            {/* Sponsored label */}
            <p className="absolute bottom-3 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                {t("home.boostAd.sponsoredSlot")}
            </p>

            {/* Shine border */}
            {/* <ShineBorder className="absolute inset-0 pointer-events-none" shineColor={["#38bdf8", "#3b82f6"]} /> */}
        </Link>
    );
}

function ListVariant({ className }: { className?: string }) {
    const { t } = useTranslation();
    return (
        <Link
            href="/premium"
            className={cn(
                "group relative w-full block",
                "bg-gradient-to-b from-[#020202] via-[#050505] to-[#070707]",
                "border border-[#1e3a5f] rounded-3xl overflow-hidden",
                "hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer",
                "flex flex-col md:flex-row items-center gap-6 p-6 min-h-[120px]",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-600/5 pointer-events-none" />

            {/* Icon */}
            <div className="flex items-center justify-center text-sky-400 flex-shrink-0 mb-5">
                <Sparkles className="w-8 h-8 text-cyan-500 transition-colors" />
            </div>

            {/* Text */}
            <div className="relative z-10 text-left flex-1">
                <h3 className="font-bold text-white text-base mb-1">{t("home.boostAd.title")}</h3>
                <p className="text-zinc-400 text-xs">
                    {t("home.boostAd.subtitle")}
                </p>
            </div>

            {/* CTA */}
            <div className="relative z-10">
                <span className="inline-block bg-white text-black font-bold rounded-xl hover:bg-zinc-100 transition-all group-hover:shadow-lg px-5 py-2 text-xs">
                    {t("home.boostAd.cta")}
                </span>
            </div>

            {/* Sponsored label */}
            <p className="absolute bottom-2 right-4 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                {t("home.boostAd.sponsoredSlot")}
            </p>

            {/* <ShineBorder className="absolute inset-0 pointer-events-none" shineColor={["#38bdf8", "#3b82f6"]} /> */}
        </Link>
    );
}

function BannerVariant({ className }: { className?: string }) {
    const { t } = useTranslation();
    return (
        <div
            className={cn(
                "relative group flex flex-col items-center justify-center p-6 rounded-2xl overflow-hidden",
                "bg-[#0f1025] border border-blue-500/30 text-center min-h-[300px]",
                className
            )}
        >
            <BorderBeam size={400} duration={10} delay={9} borderWidth={2} colorFrom="#3b82f6" colorTo="#06b6d4" />

            {/* Hex pattern background */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-[#0f1025] to-[#0f1025]" />


            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center justify-center text-sky-400 flex-shrink-0 mb-5">
                    <Sparkles className="w-8 h-8 text-cyan-500 transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{t("home.boostAd.title")}</h3>
                <p className="text-sm text-zinc-400 mb-8 max-w-[200px]">
                    {t("home.boostAd.subtitle")}
                </p>

                <Link
                    href="/premium"
                    className="bg-[#151618] border border-white/10 hover:border-blue-500/50 hover:bg-black/40 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-900/20 active:scale-95"
                >
                    {t("home.boostAd.cta")}
                </Link>

                <div className="mt-8 text-[10px] font-bold tracking-widest text-[#3b4a6b]">
                    {t("home.boostAd.sponsoredSlot")}
                </div>
            </div>
        </div>
    );
}

export function BoostServerAd({ variant = "card", className, animated = false }: BoostServerAdProps) {
    const content =
        variant === "list" ? <ListVariant className={className} /> :
            variant === "banner" ? <BannerVariant className={className} /> :
                <CardVariant className={className} />;

    if (!animated) return content;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={variant === "list" ? "w-full" : "h-full"}
        >
            {content}
        </motion.div>
    );
}
