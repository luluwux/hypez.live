import { useState, useMemo, useEffect, useRef } from 'react';
import { Server, api } from '@/lib/api';

export type SortOption = 'discover' | 'hype' | 'votes' | 'voice' | 'boost' | 'members' | 'recent';

type AdPlaceholder = { id: string; isAdPlaceholder: true };
type DiscoverItem = Server | AdPlaceholder;

interface UseDiscoverFilteringOptions {
    servers: Server[];
    selectedCategory: string;
    selectedLanguage: string;
    showNsfw: boolean;
    sortBy: SortOption;
    initialPage?: number;
}

const ITEMS_PER_PAGE = 15;

function fisherYatesShuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i]!;
        result[i] = result[j]!;
        result[j] = temp;
    }
    return result;
}

export function useDiscoverFiltering({ servers: rawServers, selectedCategory, selectedLanguage, showNsfw, sortBy, initialPage = 1 }: UseDiscoverFilteringOptions) {
    const initialServers = Array.isArray(rawServers) ? rawServers : [];
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [fetchedServers, setFetchedServers] = useState<Server[]>(() => initialServers);
    const [isLoading, setIsLoading] = useState(false);
    const [totalBackendPages, setTotalBackendPages] = useState(1);
    const hasEverLoaded = useRef(initialServers?.length > 0);
    const isFirstMount = useRef(true);

    const premiumServers = useMemo(() => {
        const premiums = initialServers.filter(s => s.premiumTier === 'PREMIUM');
        return fisherYatesShuffle(premiums);
    }, [initialServers]);

    // Fetch from backend
    useEffect(() => {
        if (isFirstMount.current && initialServers?.length > 0) {
            isFirstMount.current = false;
            return;
        }
        isFirstMount.current = false;

        let isMounted = true;

        const fetchServers = async () => {
            setIsLoading(true);
            try {
                if (sortBy === 'hype') {
                    const allHype = await api.getTrendingHype(100);
                    let filtered = allHype.filter(s => {
                        if (!showNsfw && s.nsfw) return false;
                        return true;
                    });

                    if (selectedCategory !== 'all') {
                        filtered = filtered.filter(s =>
                            s.categories?.some(c => c.toLowerCase() === selectedCategory.toLowerCase())
                        );
                    }
                    if (selectedLanguage !== 'all') {
                        filtered = filtered.filter(s =>
                            s.language?.toLowerCase() === selectedLanguage.toLowerCase()
                        );
                    }

                    const totalItems = filtered.length;
                    const totalPagesCalc = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
                    const start = (currentPage - 1) * ITEMS_PER_PAGE;
                    const pageData = filtered.slice(start, start + ITEMS_PER_PAGE);

                    if (isMounted) {
                        setFetchedServers(pageData);
                        setTotalBackendPages(totalPagesCalc);
                        hasEverLoaded.current = true;
                    }
                } else {
                    let backendSort = 'votes';
                    if (sortBy === 'discover') backendSort = 'random';
                    if (sortBy === 'voice') backendSort = 'voice';
                    if (sortBy === 'boost') backendSort = 'boost';
                    if (sortBy === 'members') backendSort = 'members';
                    if (sortBy === 'recent') backendSort = 'newest';

                    const response = await api.findServers({
                        page: currentPage,
                        limit: ITEMS_PER_PAGE,
                        sort: backendSort,
                        category: selectedCategory,
                        language: selectedLanguage,
                        nsfw: showNsfw,
                    });

                    if (isMounted) {
                        setFetchedServers(response.data);
                        setTotalBackendPages(response.meta.totalPages);
                        hasEverLoaded.current = true;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch sorted servers", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchServers();

        return () => {
            isMounted = false;
        };
    }, [sortBy, selectedCategory, selectedLanguage, showNsfw, currentPage]);

    // Build current page with premium/ad injection at reserved slots
    const currentServers = useMemo((): DiscoverItem[] => {
        const regulars = [...fetchedServers].filter(s => s.premiumTier !== 'PREMIUM');

        // Calculate premium cursor position for this page
        const isAdPage = (currentPage - 1) % 3 === 0;

        let premiumCursor = 0;
        for (let p = 1; p < currentPage; p++) {
            premiumCursor++; // slot 1 always premium
            if ((p - 1) % 3 !== 0) {
                premiumCursor++; // slot 9 premium (non-ad page)
            }
        }

        // Determine slot 1 item: premium if available, else keep regular
        let slot1Item: DiscoverItem | null = null;
        if (premiumCursor < premiumServers.length) {
            slot1Item = premiumServers[premiumCursor]!;
            premiumCursor++;
        }

        // Determine slot 9 item: ad page → Ad, else premium or Ad fallback
        let slot9Item: DiscoverItem | null = null;
        if (isAdPage) {
            slot9Item = { id: `ad-slot-${currentPage}`, isAdPlaceholder: true };
        } else if (premiumCursor < premiumServers.length) {
            slot9Item = premiumServers[premiumCursor]!;
            premiumCursor++;
        } else {
            slot9Item = { id: `ad-slot-${currentPage}`, isAdPlaceholder: true };
        }

        // Build page: start with regular servers, replace reserved slots
        const page: DiscoverItem[] = [];

        for (let i = 0; i < ITEMS_PER_PAGE; i++) {
            if (i === 0 && slot1Item) {
                page.push(slot1Item);
                regulars.splice(0, 0); // don't consume a regular for this slot
            } else if (i === 8 && slot9Item) {
                page.push(slot9Item);
            } else if (regulars.length > 0) {
                page.push(regulars.shift()!);
            }
        }

        return page;
    }, [fetchedServers, currentPage, premiumServers]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalBackendPages) {
            setCurrentPage(page);
            const el = document.getElementById('discover');
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    };

    const resetPage = () => setCurrentPage(1);

    const isInitialLoad = !hasEverLoaded.current && isLoading;

    return {
        currentServers,
        currentPage,
        totalPages: totalBackendPages,
        isLoading,
        isInitialLoad,
        handlePageChange,
        resetPage,
    };
}
