"use client";

import { useTranslation } from "@/lib/i18n/hooks";
import { useState } from "react";
import { HeroSearch } from "@/components/shared/HeroSearch";
import { PremiumShowcase } from "@/components/lului/PremiumShowcase";
import { DiscoverServers } from "@/components/lului/DiscoverServers";
import { NewlyAdded } from "@/components/lului/NewlyAdded";
import { TrendingHype } from "@/components/lului/TrendingHype";
import { TopLists } from "@/components/lului/TopLists";
import { FAQ } from "@/components/lului/FAQ";
import ShinyText from "@/components/shared/ShinyText";
import CurvedLoop from "@/components/lului/CurvedLoop";
import { motion } from "framer-motion";

import { Server } from "@/lib/api";

const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const }
    }
};

interface HomeClientProps {
    initialServers: Server[];
    initialTrendingServers: Server[];
    initialNewlyAddedServers: Server[];
    initialTotalMembers: number;
}

export function HomeClient({ 
    initialServers, 
    initialTrendingServers, 
    initialNewlyAddedServers, 
    initialTotalMembers 
}: HomeClientProps) {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [newlyAddedServers] = useState<Server[]>(initialNewlyAddedServers);
    const [trendingServers] = useState<Server[]>(initialTrendingServers);
    const [totalMembers] = useState<number | null>(initialTotalMembers);

    const handleTagSelect = (tag: string) => {
        setSelectedCategory(tag);
        const el = document.getElementById("discover");
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    return (
        <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col items-center overflow-hidden">

            {/* HERO SECTION */}
            <motion.div
                className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-full max-w-6xl mt-40 mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                {/* Active Members Count */}
                <div className="mb-6 flex items-center justify-center">
                    <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl shadow-sky-500/5 flex items-center gap-2">
                        <ShinyText text={totalMembers ? t('home.trustedBy', { count: totalMembers }) : 'Loading...'} disabled={false} speed={3} className="font-bold text-sm" color="#cbd5e1" shineColor="#ffffff" />

                    </div>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-2xl mb-4">
                    {t("home.hero.title")}
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                    {t("home.hero.subtitle")}
                </p>
                <div className="w-full">
                    <HeroSearch onTagSelect={handleTagSelect} servers={initialServers} showTags={false} />
                </div>
            </motion.div>

            {/* PREMIUM SERVERS */}
            <motion.div
                className="relative z-10 w-full mb-16"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
            >
                <PremiumShowcase servers={initialServers.filter(s => s.premiumTier === 'PREMIUM')} />
            </motion.div>

            {/* TRENDING SERVERS */}
            <motion.div
                className="relative z-10 w-full mb-16"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
            >
                <TrendingHype servers={trendingServers} />
            </motion.div>

            {/* START DISCOVERING */}
            <motion.div
                id="discover"
                className="relative z-10 w-full mb-16"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
            >
                <DiscoverServers
                    selectedCategoryProp={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    initialServers={initialServers}
                />
            </motion.div>

            {/* NEWLY ADDED */}
            <motion.div
                className="relative z-10 w-full mb-16"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
            >
                <NewlyAdded servers={newlyAddedServers} />
                <TopLists />
            </motion.div>

            {/* CURVED LOOP */}
            <motion.div
                className="w-full z-10 overflow-hidden mb-32"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                <CurvedLoop marqueeText="DISCOVER • CONNECT • PLAY • CHAT • COMMUNITY • GAMING • MUSIC • EVENTS •" speed={2} curveAmount={300} direction="right" />
            </motion.div>

            {/* FAQ */}
            <motion.div
                className="relative z-10 w-full"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
            >
                <FAQ />
            </motion.div>

        </div>
    );
}
