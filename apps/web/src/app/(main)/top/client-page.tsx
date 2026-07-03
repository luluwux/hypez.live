"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Server, api } from "@/lib/api";
import { ServerListItem } from "@/components/top/ServerListItem";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { HeroSearch } from "@/components/shared/HeroSearch";
import { motion } from "framer-motion";
import { Loader2, SearchX } from "lucide-react";
import ShinyText from "@/components/shared/ShinyText";
import { useTranslation } from "@/lib/i18n/hooks";

const TABS = [
    { id: "hype", label: "Hype" },
    { id: "votes", label: "Votes" },
    { id: "members", label: "Members" },
    { id: "voice", label: "Voice" },
    { id: "boost", label: "Boosts" },
];

const LIMIT = 20;

function ListSkeleton() {
    return (
        <div className="space-y-3 min-h-[700px]">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-b from-[#010101] via-[#040404] to-[#080808] border border-white/5"
                >
                    <div className="w-10 h-5 rounded bg-zinc-800/40 animate-pulse" />
                    <div className="w-14 h-14 rounded-xl bg-zinc-800/40 animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                        <div className="w-1/3 h-4 rounded bg-zinc-800/40 animate-pulse" />
                    </div>
                    <div className="w-24 h-10 rounded bg-zinc-800/40 animate-pulse flex-shrink-0" />
                </div>
            ))}
        </div>
    );
}

interface TopClientProps {
    initialHypeServers?: Server[];
    initialVotesServers?: Server[];
}

export function TopClient({ initialHypeServers: rawHype = [], initialVotesServers: rawVotes = [] }: TopClientProps) {
    const initialHypeServers = Array.isArray(rawHype) ? rawHype : [];
    const initialVotesServers = Array.isArray(rawVotes) ? rawVotes : [];
    const { t } = useTranslation();
    const [activeSort, setActiveSort] = useState("hype");
    const [servers, setServers] = useState<Server[]>(() => initialHypeServers.slice(0, LIMIT));
    const [loading, setLoading] = useState(() => initialHypeServers.length === 0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(() => initialHypeServers.length > LIMIT);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date());
    const loadingRef = useRef(false);
    const isFirstMount = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const relativeTime = useCallback((date: Date): string => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 5) return t('top.time.justNow');
        if (seconds < 60) return t('top.time.secondsAgo').replace('{seconds}', String(seconds));
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t('top.time.minutesAgo').replace('{minutes}', String(minutes));
        const hours = Math.floor(minutes / 60);
        return t('top.time.hoursAgo').replace('{hours}', String(hours));
    }, [t]);

    const fetchServers = useCallback(async (sort: string, pageNum: number, append: boolean = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            let data: Server[];
            let totalPages = 1;

            if (sort === "hype") {
                const all = await api.getTrendingHype(50);
                data = all.slice(0, LIMIT);
                totalPages = Math.ceil(all.length / LIMIT);
            } else {
                const res = await api.findServers({ sort, limit: LIMIT, page: pageNum, ignorePremiumBoost: true });
                data = res.data;
                totalPages = res.meta.totalPages ?? 1;
            }

            if (append) {
                setServers((prev) => [...prev, ...data]);
            } else {
                setServers(data);
                setLastUpdated(new Date());
            }

            setHasMore(pageNum < totalPages);
        } catch (err) {
            console.error("[Top] fetch error:", err);
            setError(t('top.states.error'));
        } finally {
            setLoading(false);
            setLoadingMore(false);
            loadingRef.current = false;
        }
    }, []);

    // Initial fetch + on sort change
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            if (activeSort === "hype" && initialHypeServers.length > 0) {
                return;
            }
            if (activeSort === "votes" && initialVotesServers.length > 0) {
                setServers(initialVotesServers);
                setHasMore(true);
                setLoading(false);
                return;
            }
        }

        setPage(1);
        setServers([]);
        setHasMore(true);
        setError(null);
        loadingRef.current = false;
        fetchServers(activeSort, 1);
    }, [activeSort, fetchServers]);

    // Periodic background refresh every 60s (only page 1, no loading indicators)
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            if (!loadingRef.current) {
                fetchServers(activeSort, 1);
            }
        }, 60_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [activeSort, fetchServers]);

    // Load more
    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore || loadingRef.current) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchServers(activeSort, nextPage, true);
    }, [activeSort, page, loadingMore, hasMore, fetchServers]);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const sentinel = document.getElementById("load-more-sentinel");
        if (!sentinel || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore, hasMore]);

    const sectionVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const } },
    };

    return (
        <div className="min-h-screen pt-36 pb-20">
            <div className="container max-w-6xl mx-auto px-4">

                {/* Header */}
                <motion.div
                    className="flex flex-col items-center text-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl shadow-sky-500/5 mb-6">
                        {lastUpdated && (
                            <>
                                 <ShinyText text={`⚡ ${t('top.lastUpdated')}`} disabled={false} speed={3} className="font-bold text-sm" color="#cbd5e1" shineColor="#ffffff" />
                                <span className="text-sm text-zinc-500 font-medium">
                                    {relativeTime(lastUpdated)}
                                </span>
                            </>
                        )}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-2xl pb-1">
                        {t('top.hero.title')}
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-xl mt-3">
                        {t('top.hero.subtitle')}
                    </p>
                </motion.div>

                {/* Search */}
                <motion.div
                    className="mb-10"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <HeroSearch showTags={false} servers={servers} />
                </motion.div>

                {/* Tabs — centered */}
                <motion.div
                    className="flex justify-center mb-10"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <AnimatedTabs
                        tabs={TABS.map(tab => ({ ...tab, label: t(`discover.filters.sort.${tab.id}`) || tab.label }))}
                        activeTab={activeSort}
                        onTabChange={setActiveSort}
                        className="bg-zinc-900/50 p-1 rounded-full border border-white/5"
                    />
                </motion.div>

                {/* Server List */}
                <motion.div
                    className="space-y-3 min-h-[700px]"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {loading ? (
                        <ListSkeleton />
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-zinc-500">{error}</p>
                        </div>
                    ) : servers.length > 0 ? (
                        servers.map((server, index) => (
                            <ServerListItem
                                key={`${server.id}-${index}`}
                                server={server}
                                rank={index + 1}
                                activeSort={activeSort}
                            />
                        ))
                    ) : (
                        <div className="text-center py-20 flex flex-col items-center gap-3">
                            <SearchX className="w-12 h-12 text-zinc-600" />
                            <p className="text-zinc-500 text-lg font-medium">{t('top.states.noServers')}</p>
                            <p className="text-zinc-600 text-sm">{t('top.states.noServersDesc')}</p>
                        </div>
                    )}

                    {loadingMore && (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                        </div>
                    )}

                    {hasMore && !loading && !error && servers.length > 0 && (
                        <div id="load-more-sentinel" className="h-1" />
                    )}
                </motion.div>

            </div>
        </div>
    );
}
