import { TopClient } from "./client-page";
import type { Metadata } from 'next';
import { api, Server } from "@/lib/api";

export const metadata: Metadata = {
  title: 'Top Servers',
  description: 'The most popular Discord servers ranked by votes and hype. See which communities are trending on Hypez.',
  openGraph: {
    title: 'Top Discord Servers — Hypez',
    description: 'Most popular Discord servers ranked by votes and hype.',
    url: 'https://hypez.live/top',
  },
};

export const revalidate = 60; // 60 seconds

interface PageProps {
    searchParams?: Promise<{
        category?: string;
        lang?: string;
        sort?: string;
        page?: string;
    }>;
}

export default async function TopPage({ searchParams }: PageProps) {
    let params: any = {};
    if (searchParams) {
        try {
            params = (await searchParams) || {};
        } catch (e: any) {
            if (e?.digest === 'DYNAMIC_SERVER_USAGE' || e?.message?.includes('Dynamic server usage')) {
                throw e;
            }
            console.error("Failed to await searchParams in TopPage:", e);
        }
    }

    let initialHypeServers: Server[] = [];
    let initialVotesServers: Server[] = [];

    try {
        const [hypeRes, votesRes] = await Promise.all([
            api.getTrendingHype(50),
            api.findServers({ sort: 'votes', limit: 20, page: 1, ignorePremiumBoost: true })
        ]);
        initialHypeServers = Array.isArray(hypeRes) ? hypeRes : [];
        initialVotesServers = (votesRes && Array.isArray(votesRes.data)) ? votesRes.data : [];
    } catch (e) {
        console.error("Failed to fetch top page initial data on server:", e);
    }

    return (
        <TopClient 
            initialHypeServers={initialHypeServers}
            initialVotesServers={initialVotesServers}
        />
    );
}
