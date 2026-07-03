"use client";

import { useTranslation } from "@/lib/i18n/hooks";

import { useState } from "react";
import { motion } from "framer-motion";
import { PricingCard } from "@/components/premium/PricingCard";
import { FeatureComparison } from "@/components/premium/FeatureComparison";
import { PremiumFAQ } from "@/components/premium/PremiumFAQ";
import ShinyText from "@/components/shared/ShinyText";
import { cn } from "@/lib/utils";

type BillingCycle = "Daily" | "Weekly" | "Monthly";
type Currency = "USD" | "TRY";

const USD_TO_TRY = 35;

export default function PremiumPage() {
    const { t } = useTranslation();
    const [cycle, setCycle] = useState<BillingCycle>("Monthly");
    const [currency, setCurrency] = useState<Currency>("USD");

    const handleCycleChange = (c: BillingCycle) => setCycle(c);

    const formatPrice = (usd: number): string => {
        if (currency === "TRY") return `₺${(usd * USD_TO_TRY).toFixed(0)}`;
        // Use up to 2 decimal places but remove trailing zeros if it's exact .00 or .x0 maybe?
        // Let's just fix it to 2 decimal places, and remove .00 if needed. 
        // Example: 2.50 stays 2.50, 9.99 stays 9.99
        return `$${Number(usd.toFixed(2))}`;
    };

    const getPrice = (base: number) => {
        let usd: number;
        if (cycle === "Daily") usd = base / 20;
        else if (cycle === "Weekly") usd = base / 4;
        else usd = base;
        return formatPrice(usd);
    };

    const lifetimePrice = currency === "TRY" ? "₺1.750" : "$49.99";

    return (
        <div className="min-h-screen pt-32 pb-20 relative overflow-hidden">

            {/* Hero Section */}
            <div className="relative z-10 text-center px-4 mb-16">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl shadow-sky-500/5 mb-6">
                    <ShinyText text={`✨ ${t('premium.title')}`} disabled={false} speed={3} className="font-bold text-sm" color="#cbd5e1" shineColor="#ffffff" />
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-2xl mb-6">
                    {t('premium.subtitle')}
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                    {t('premium.description')}
                </p>

                {/* Currency Toggle */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <span className={cn("text-sm font-medium transition-colors", currency === "USD" ? "text-white" : "text-zinc-500")}>$ USD</span>
                    <button
                        onClick={() => setCurrency(c => c === "USD" ? "TRY" : "USD")}
                        className={cn(
                            "relative w-12 h-6 rounded-full transition-colors",
                            currency === "TRY" ? "bg-brand-500" : "bg-zinc-700"
                        )}
                    >
                        <motion.div
                            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                            animate={{ left: currency === "TRY" ? 26 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </button>
                    <span className={cn("text-sm font-medium transition-colors", currency === "TRY" ? "text-white" : "text-zinc-500")}>₺ TRY</span>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-2 p-1 bg-[#151618] border border-white/5 rounded-full w-fit mx-auto backdrop-blur-sm relative z-10">
                    {(["Daily", "Weekly", "Monthly"] as BillingCycle[]).map((c) => (
                        <button
                            key={c}
                            onClick={() => handleCycleChange(c)}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10",
                                cycle === c ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {cycle === c && (
                                <motion.div
                                    layoutId="billingTab"
                                    className="absolute inset-0 bg-zinc-800 rounded-full z-[-1]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {t(`premium.billing.${c.toLowerCase()}`)}
                        </button>
                    ))}
                </div>
                <div className="mt-4 text-xs text-sky-400 font-medium h-4">
                    {cycle === "Monthly" && t('premium.billing.save')}
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-32 items-start relative z-0">

                {/* 1. Free (Left) */}
                <div className="md:mt-8">
                    <PricingCard
                        tier={t('premium.tiers.free')}
                        price={t('premium.tiers.free')}
                        period={t(`premium.billing.${cycle.toLowerCase()}`)}
                        features={[
                            t('premium.features.listing'),
                            t('premium.features.bump'),
                            t('premium.features.socialLinks')
                        ]}
                        description={t('premium.tiers.freeDesc')}
                    />
                </div>

                {/* 2. Premium (Center - Lifted) */}
                <div className="md:-mt-4 z-20">
                    <PricingCard
                        tier={t('premium.tiers.premium')}
                        price={getPrice(9.99)}
                        period={t(`premium.billing.${cycle.toLowerCase()}`)}
                        features={[
                            t('premium.features.highlighted'),
                            t('premium.features.fasterBump'),
                            t('premium.features.animatedBanner'),
                            t('premium.features.topSearch'),
                            t('premium.features.showcase'),
                            t('premium.features.support')
                        ]}
                        description={t('premium.tiers.premiumDesc')}
                        isPopular={true}
                    />
                </div>

                {/* 3. Limitsiz (Right - Lifetime) */}
                <div className="md:mt-8">
                    <PricingCard
                        tier={t('premium.tiers.limitsiz')}
                        price={lifetimePrice}
                        period={t('premium.tiers.lifetime')}
                        features={[
                            t('premium.features.highlighted'),
                            t('premium.features.fasterBump'),
                            t('premium.features.animatedBanner'),
                            t('premium.features.topSearch'),
                            t('premium.features.showcase'),
                            t('premium.features.support')
                        ]}
                        description={t('premium.tiers.limitsizDesc')}
                    />
                </div>
            </div>

            {/* Feature Table */}
            <FeatureComparison />

            {/* FAQ */}
            <PremiumFAQ />

        </div>
    );
}
