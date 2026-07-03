"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShineBorder } from "@/components/lului/BorderShine";
import { useTranslation } from "@/lib/i18n/hooks";

interface PricingCardProps {
    tier: string;
    price: string;
    period: string;
    features: string[];
    description: string;
    isPopular?: boolean;
    variant?: "blue" | "gold";
}

export function PricingCard({ tier, price, period, features, description, isPopular, variant }: PricingCardProps) {
    const { t } = useTranslation();
    const isPremium = isPopular && variant !== "gold";
    const isGold = variant === "gold";
    const isSpecial = isPremium || isGold;

    const accentColor = isGold ? "text-amber-400" : "text-sky-400";
    const borderColor = isGold ? "border-amber-500/20" : "border-sky-500/20";
    const shadowColor = isGold
        ? "shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)]"
        : "shadow-[0_0_30px_-10px_rgba(14,165,233,0.15)]";
    const badgeBg = isGold ? "bg-amber-500" : "bg-sky-500";
    const badgeText = isGold ? t('premium.badge.bestValue') : t('premium.badge.mostPopular');
    const shineColors = isGold ? ["#fbbf24", "#f59e0b"] : ["#38bdf8", "#0ea5e9"];
    const checkBg = isGold ? "bg-amber-500/20 text-amber-400" : isSpecial ? "bg-sky-500/20 text-sky-400" : "bg-zinc-800 text-zinc-500";
    const btnGradient = isGold
        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-500/20"
        : isPremium
            ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20"
            : "bg-zinc-800 hover:bg-zinc-700 text-white";
    const cardBg = isSpecial ? "bg-[#121214]" : "bg-[#0f0f11]";
    const cardBorder = isSpecial ? borderColor : "border-white/5";
    const scale = isPopular ? "scale-105" : "";

    return (
        <motion.div
            className={cn(
                "relative group flex flex-col p-8 rounded-3xl h-full border transition-all duration-300",
                cardBg, cardBorder, shadowColor, scale, "z-10"
            )}
            whileHover={{ y: -5 }}
        >
            {isPopular && (
                <>
                    <div className="absolute top-0 right-0 p-3">
                        <span className={cn(badgeBg, "text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.4)]")}>
                            {badgeText}
                        </span>
                    </div>
                    <ShineBorder
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        shineColor={shineColors}
                        borderWidth={1}
                    />
                </>
            )}

            {/* Header */}
            <div className="mb-6">
                <h3 className={cn("text-xl font-bold mb-2", isSpecial ? accentColor : "text-white")}>
                    {tier}
                </h3>
                <p className="text-zinc-400 text-sm min-h-[40px]">{description}</p>
            </div>

            {/* Price */}
            <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{price}</span>
                {price !== "Free" && price !== "Ücretsiz" && price !== t('premium.tiers.free') && <span className="text-zinc-500">/{period.toLowerCase()}</span>}
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                        <div className={cn(
                            "mt-0.5 rounded-full p-0.5 flex items-center justify-center",
                            checkBg
                        )}>
                            <Check className="w-3 h-3" />
                        </div>
                        {feat}
                    </li>
                ))}
            </ul>

            {/* Action */}
            <Button
                className={cn(
                    "w-full h-12 rounded-xl font-bold transition-all",
                    btnGradient
                )}
            >
                {price === "Free" || price === "Ücretsiz" || price === t('premium.tiers.free') ? t('premium.button.currentPlan') : t('premium.button.getStarted')}
            </Button>
        </motion.div>
    );
}
