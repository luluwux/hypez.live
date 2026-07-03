import { api, Server } from "@/lib/api";
import { PremiumTier } from "@hypez/shared-types";
import { HomeClient } from "./client-page";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hypez — Discover Discord Servers',
  description: 'Find and join the best Discord servers. Browse thousands of communities by category, vote for your favorites, and grow your server on Hypez.',
  openGraph: {
    title: 'Hypez — Discover Discord Servers',
    description: 'Find and join the best Discord servers. Browse thousands of communities by category.',
    url: 'https://hypez.live',
  },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
    // Fetch Data on Server
    let initialServers: Server[] = [];
    let trendingServers: Server[] = [];
    let newlyAddedServers: Server[] = [];
    let totalMembers = 0;

    try {
        const [serversRes, trendingRes, newlyRes, membersRes] = await Promise.all([
            api.getServers(),
            api.getTrendingHype(8),
            api.getNewlyAdded(12),
            api.getTotalMembers()
        ]);
        initialServers = serversRes;
        trendingServers = trendingRes;
        newlyAddedServers = newlyRes;
        totalMembers = membersRes;

        // Fallback for debugging if API returns empty
        if (initialServers.length === 0) {
            console.log("API returned 0 servers, adding mock for visibility");
            initialServers.push({
                id: 'debug-manual-1',
                name: 'API Connection Failed or Empty',
                icon: '',
                memberCount: 0,
                activeMemberCount: 0,
                votes: 0,
                categories: ['System'],
                description: 'Could not fetch servers from API or database is empty.',
                premiumTier: PremiumTier.NONE
            });
        }
    } catch (e) {
        console.error("Failed to fetch initial servers:", e);
    }

    /* Client components inside Server Component need props passing */
    return (
        <HomeClient 
            initialServers={initialServers} 
            initialTrendingServers={trendingServers}
            initialNewlyAddedServers={newlyAddedServers}
            initialTotalMembers={totalMembers}
        />
    );
}
