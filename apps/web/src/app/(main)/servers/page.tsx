import { Suspense } from "react";
import { DiscoverClient } from "./client-page";
import { api, Server } from "@/lib/api";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: 'Discover Servers',
  description: 'Browse and discover Discord servers by category. Find gaming, anime, music, and more communities on Hypez.',
  openGraph: {
    title: 'Discover Discord Servers — Hypez',
    description: 'Browse Discord servers by category. Find your next community.',
    url: 'https://hypez.live/servers',
  },
};

export const revalidate = 60; // 60 seconds

interface PageProps {
    searchParams: Promise<{
        category?: string;
        lang?: string;
        sort?: string;
        page?: string;
    }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
    let params: any = {};
    if (searchParams) {
        try {
            params = (await searchParams) || {};
        } catch (e: any) {
            if (e?.digest === 'DYNAMIC_SERVER_USAGE' || e?.message?.includes('Dynamic server usage')) {
                throw e;
            }
            console.error("Failed to await searchParams in DiscoverPage:", e);
        }
    }

    let category = params.category || 'all';
    if (Array.isArray(category)) category = category[0] || 'all';

    let lang = params.lang || 'all';
    if (Array.isArray(lang)) lang = lang[0] || 'all';

    let sort = params.sort || 'discover';
    if (Array.isArray(sort)) sort = sort[0] || 'discover';

    let pageStr = params.page || '1';
    if (Array.isArray(pageStr)) pageStr = pageStr[0] || '1';
    const page = parseInt(pageStr, 10) || 1;

    let servers: Server[] = [];
    try {
        if (sort === 'hype') {
            const allHype = await api.getTrendingHype(100);
            let filtered = Array.isArray(allHype) ? allHype : [];
            
            if (category !== 'all') {
                filtered = filtered.filter(s =>
                    s && s.categories?.some(c => c && c.toLowerCase() === category.toLowerCase())
                );
            }
            servers = filtered.slice((page - 1) * 15, page * 15);
        } else {
            let backendSort = 'votes';
            if (sort === 'discover') backendSort = 'random';
            if (sort === 'voice') backendSort = 'voice';
            if (sort === 'boost') backendSort = 'boost';
            if (sort === 'members') backendSort = 'members';
            if (sort === 'recent') backendSort = 'newest';

            const response = await api.findServers({
                page,
                limit: 15,
                sort: backendSort,
                category,
                language: lang,
            });
            servers = response && Array.isArray(response.data) ? response.data : [];
        }
    } catch (e) {
        console.error("Failed to fetch initial servers in page.tsx:", e);
    }

    return (
        <Suspense>
            <DiscoverClient initialServers={servers} />
        </Suspense>
    );
}
