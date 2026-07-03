"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Server } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSearch } from "@/components/shared/HeroSearch";
import { DiscoverGridCard } from "@/components/lului/DiscoverGridCard";
import { DiscoverListCard } from "@/components/lului/DiscoverListCard";
import { BoostServerAd } from "@/components/shared/BoostServerAd";
import { useDiscoverFiltering, SortOption } from "@/hooks/useDiscoverFiltering";
import { useNsfwPreference } from "@/components/auth/user-menu";
import { useTranslation } from "@/lib/i18n/hooks";
import * as Icons from "lucide-react";
import { LayoutGrid, List, Filter, Users, Star, Clock, Compass, Flame, Hash, Globe, Mic } from "lucide-react";
import { FALLBACK_CATEGORIES } from "@hypez/shared-types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import ShinyText from "@/components/shared/ShinyText";


const sortOptions: { id: SortOption; label: string; icon: any }[] = [
    { id: 'hype', label: 'Hype', icon: Flame },
    { id: 'votes', label: 'Votes', icon: Star },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'boost', label: 'Boost', icon: Filter },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'recent', label: 'New', icon: Clock },
];

const VALID_SORTS = ['discover', 'hype', 'votes', 'voice', 'boost', 'members', 'recent'];

interface DiscoverClientProps {
    initialServers: Server[];
}

function DiscoverSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[700px]">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="w-full h-[340px] bg-[#111214] rounded-3xl border border-white/5 overflow-hidden animate-pulse">
                        <div className="h-[150px] bg-white/[0.02]" />
                        <div className="px-5 pt-0 pb-5 space-y-3">
                            <div className="-mt-8 mb-2 w-16 h-16 rounded-[18px] bg-[#1e1f22] border border-white/5" />
                            <div className="h-4 w-2/3 rounded bg-white/[0.04]" />
                            <div className="h-3 w-full rounded bg-white/[0.02]" />
                            <div className="h-3 w-3/4 rounded bg-white/[0.02]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-4 min-h-[700px]">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full h-[120px] bg-[#111214] rounded-[24px] border border-white/5 animate-pulse flex">
                    <div className="w-[240px] h-full bg-white/[0.02]" />
                    <div className="flex-1 p-5 space-y-3">
                        <div className="h-4 w-1/3 rounded bg-white/[0.04]" />
                        <div className="h-3 w-2/3 rounded bg-white/[0.02]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function getInitialParam(params: URLSearchParams, key: string, fallback: string): string {
    const v = params.get(key);
    return v || fallback;
}

export function DiscoverClient({ initialServers: rawServers }: DiscoverClientProps) {
    const initialServers = Array.isArray(rawServers) ? rawServers : [];
    const searchParams = useSearchParams();
    const router = useRouter();

    const { t } = useTranslation();

    // Initialize state from URL params
    const [selectedCategory, setSelectedCategory] = useState(() =>
        getInitialParam(searchParams, 'category', 'all')
    );
    const [selectedLanguage, setSelectedLanguage] = useState(() =>
        getInitialParam(searchParams, 'lang', 'all')
    );
    const { nsfwEnabled: showNsfw } = useNsfwPreference();
    const [sortBy, setSortBy] = useState<SortOption>(() => {
        const s = searchParams.get('sort');
        return s && VALID_SORTS.includes(s) ? s as SortOption : 'discover';
    });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const v = searchParams.get('view');
        return v === 'list' ? 'list' : 'grid';
    });
    const [discoverMode, setDiscoverMode] = useState<'discover' | 'members'>('discover');
    const [initialPage] = useState(() => {
        const p = parseInt(searchParams.get('page') || '1', 10);
        return isNaN(p) || p < 1 ? 1 : p;
    });

    const effectiveSort = discoverMode === 'members' ? 'members' : sortBy;

    const {
        currentServers,
        currentPage,
        totalPages,
        isLoading,
        isInitialLoad,
        handlePageChange,
        resetPage,
    } = useDiscoverFiltering({
        servers: initialServers,
        selectedCategory,
        selectedLanguage,
        showNsfw,
        sortBy: effectiveSort,
        initialPage,
    });

    // Sync state to URL
    const syncURL = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === 'all' || value === 'discover' || value === 'grid' || value === '1') {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }
        const qs = params.toString();
        const url = qs ? `/servers?${qs}` : '/servers';
        router.replace(url, { scroll: false });
    }, [searchParams, router]);

    const handleCategoryChange = (c: string) => {
        setSelectedCategory(c);
        syncURL({ category: c });
        resetPage();
    };

    const handleLanguageChange = (l: string) => {
        setSelectedLanguage(l);
        syncURL({ lang: l });
        resetPage();
    };

    const handleSortChange = (s: SortOption) => {
        setSortBy(s);
        setDiscoverMode('discover');
        syncURL({ sort: s });
        resetPage();
    };

    const handleDiscoverMode = (mode: 'discover' | 'members') => {
        setDiscoverMode(mode);
        if (mode === 'members') {
            setSortBy('members');
            syncURL({ sort: 'members' });
        } else {
            setSortBy('discover');
            syncURL({ sort: null });
        }
        resetPage();
    };

    const onPageChange = (page: number) => {
        handlePageChange(page);
        syncURL({ page: page > 1 ? String(page) : null });
    };

    const onViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        syncURL({ view: mode });
    };

    return (
        <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col items-center overflow-hidden">

            {/* HERO SEARCH AREA */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 md:px-8 w-full max-w-7xl mx-auto mt-42 mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl shadow-sky-500/5 mb-6">
                   
                        <>
                            <ShinyText text={`🚀 ${t('discover.hero.badge')}`} disabled={false} speed={3} className="font-bold text-sm" color="#cbd5e1" shineColor="#ffffff" />
                         
                        </>
                 
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-2xl mb-4">
                    {t('discover.hero.title')}
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                    {t('discover.hero.subtitle')}
                </p>
                <div className="w-full">
                    <HeroSearch onTagSelect={handleCategoryChange} servers={initialServers} showTags={false} />
                </div>
            </div>

            {/* FILTER BAR */}
            <motion.div
                id="discover"
                className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-8 relative z-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {/* Background refresh indicator */}
                <div className="h-0.5 w-full mb-3 rounded-full overflow-hidden">
                    {isLoading && !isInitialLoad && (
                        <motion.div
                            className="h-full bg-gradient-to-r from-transparent via-brand-500 to-transparent w-1/3"
                            initial={{ x: '-100%' }}
                            animate={{ x: '400%' }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl rounded-[24px] p-3 md:px-5">
                    
                    <div className="flex items-center px-2 w-full md:w-auto">
                        <span className="text-zinc-400 text-sm font-medium">
                            {t('discover.filters.serversFound').split('{count}').map((part, i, arr) => (
                                <span key={i}>
                                    {part}
                                    {i < arr.length - 1 && <strong className="text-white">{currentServers.length}</strong>}
                                </span>
                            ))}
                        </span>
                    </div>

                    {/* Right: Selects & Toggles */}
                    <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                        
                        {/* Sort Select */}
                        <div className="flex items-center relative group">
                            <Select value={discoverMode === 'members' ? 'members' : sortBy} onValueChange={(val) => {
                                if (val === 'members') handleDiscoverMode('members');
                                else if (val === 'discover') handleDiscoverMode('discover');
                                else handleSortChange(val as SortOption);
                            }}>
                                <SelectTrigger className="w-[180px] bg-black/40 border-white/10 hover:border-white/20 transition-colors h-10 text-zinc-200 rounded-xl pl-9">
                                    <List className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-brand-400 transition-colors" />
                                    <SelectValue placeholder={t('discover.filters.sortBy')} />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] bg-[#0f0f11] border-white/10 text-zinc-200 rounded-xl shadow-2xl">
                                    <SelectItem value="discover" className="focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <Compass className="w-4 h-4" />
                                            <span>{t('discover.filters.sort.discover')}</span>
                                        </div>
                                    </SelectItem>
                                    {sortOptions.map(option => {
                                        const Icon = option.icon;
                                        return (
                                            <SelectItem key={option.id} value={option.id} className="focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4" />
                                                    <span>{t(`discover.filters.sort.${option.id}`)}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category Select */}
                        <div className="flex items-center relative group">
                            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="w-[160px] bg-black/40 border-white/10 hover:border-white/20 transition-colors h-10 text-zinc-200 rounded-xl pl-9">
                                    <Hash className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-brand-400 transition-colors" />
                                    <SelectValue placeholder={t('discover.filters.category')} />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-h-[280px] overflow-y-auto bg-[#0f0f11] border-white/10 text-zinc-200 rounded-xl shadow-2xl">
                                    <SelectItem value="all" className="focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4" />
                                            <span>{t('discover.filters.all')}</span>
                                        </div>
                                    </SelectItem>
                                    {FALLBACK_CATEGORIES.filter(c => c.isActive).map(cat => {
                                        const CatIcon = (Icons as any)[cat.emoji];
                                        return (
                                            <SelectItem key={cat.id} value={cat.id} className="focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    {CatIcon ? <CatIcon className="w-4 h-4" /> : <span>{cat.emoji}</span>}
                                                    <span>{cat.name}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-white/10 mx-1 hidden md:block" />

                        {/* Grid / List Toggle */}
                        <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-1 shrink-0">
                            <button
                                onClick={() => onViewModeChange('grid')}
                                className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    viewMode === 'grid' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onViewModeChange('list')}
                                className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    viewMode === 'list' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* SERVER LIST AREA */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-32 relative z-10">

                {isInitialLoad ? (
                    <DiscoverSkeleton viewMode={viewMode} />
                ) : (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "flex flex-col gap-4",
                        "min-h-[700px]"
                    )}>
                        <AnimatePresence mode="wait">
                            {currentServers.map((s, idx) => {
                                if ('isAdPlaceholder' in s && s.isAdPlaceholder) {
                                    const adVariant = viewMode === 'grid' ? 'card' : 'list';
                                    return <BoostServerAd key={`ad-${s.id}`} variant={adVariant} animated />;
                                }

                                const server = s as Server;
                                const isPriority = idx < 3;
                                if (viewMode === 'grid') {
                                    return <DiscoverGridCard key={`${server.id}-${idx}`} server={server} sortBy={effectiveSort} isPriority={isPriority} />;
                                } else {
                                    return <DiscoverListCard key={`${server.id}-${idx}`} server={server} sortBy={effectiveSort} isPriority={isPriority} />;
                                }
                            })}
                        </AnimatePresence>

                        {currentServers.length === 0 && (
                            <div className="col-span-full py-20 text-center text-zinc-500 text-lg">
                                {t('discover.hero.noResults')}
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }}
                                        className={cn("cursor-pointer select-none border border-white/5 bg-[#151618] text-zinc-400 hover:text-white hover:bg-white/10", currentPage === 1 && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>

                                {(() => {
                                    const maxVisible = 5;
                                    let startPage = Math.max(1, currentPage - 2);
                                    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                    if (endPage - startPage + 1 < maxVisible) {
                                        startPage = Math.max(1, endPage - maxVisible + 1);
                                    }

                                    return Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                                        const pNum = startPage + i;
                                        return (
                                            <PaginationItem key={pNum}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={currentPage === pNum}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onPageChange(pNum);
                                                    }}
                                                    className={cn(
                                                        "cursor-pointer select-none transition-all duration-200 border border-white/5",
                                                        currentPage === pNum
                                                            ? "bg-brand-500 text-white hover:bg-brand-600 hover:text-white border-brand-500/50"
                                                            : "bg-[#151618] text-zinc-400 hover:text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    {pNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    });
                                })()}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onPageChange(currentPage + 1); }}
                                        className={cn("cursor-pointer select-none border border-white/5 bg-[#151618] text-zinc-400 hover:text-white hover:bg-white/10", currentPage === totalPages && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    );
}
