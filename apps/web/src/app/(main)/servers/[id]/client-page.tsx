"use client";

import { useState } from "react";
import { ServerHeader } from "@/components/server/ServerHeader";
import { ServerTabs } from "@/components/server/ServerTabs";
import { ServerOverview } from "@/components/server/ServerOverview";
import { useTranslation } from "@/lib/i18n/hooks";
import { Server } from "@/lib/api";
import dynamic from "next/dynamic";

const LoadingPlaceholder = () => (
    <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
        <div className="w-8 h-8 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin mb-4" />
    </div>
);

const ServerStats = dynamic(() => import("@/components/server/ServerStats").then(mod => mod.ServerStats), {
    loading: LoadingPlaceholder,
    ssr: false
});

const ServerEmojis = dynamic(() => import("@/components/server/ServerEmojis").then(mod => mod.ServerEmojis), {
    loading: LoadingPlaceholder,
    ssr: false
});

const ServerStickers = dynamic(() => import("@/components/server/ServerStickers").then(mod => mod.ServerStickers), {
    loading: LoadingPlaceholder,
    ssr: false
});

interface ServerDetailClientProps {
    server: Server;
}

export function ServerDetailClient({ server }: ServerDetailClientProps) {
    const [activeTab, setActiveTab] = useState("general");
    const { t } = useTranslation();

    const TABS = [
        { id: "general", label: t('server.tabs.general') },
        { id: "statistics", label: t('server.tabs.statistics') },
        { id: "emojis", label: t('server.tabs.emojis') },
        { id: "sticker", label: t('server.tabs.sticker') },
    ];

    return (
        <div className="min-h-screen pb-20">

            {/* Header Section */}
            <ServerHeader server={server} />

            {/* Tabs */}
            <ServerTabs
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className="-mt-8 relative z-20"
            />

            <div className="container mx-auto px-4 max-w-7xl mt-8">
                {/* Tab Content */}
                <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === "general" && <ServerOverview server={server} />}

                    {activeTab === "statistics" && <ServerStats server={server} />}

                    {activeTab === "emojis" && <ServerEmojis server={server} />}

                    {activeTab === "sticker" && <ServerStickers server={server} />}
                </div>

            </div>
        </div>
    );
}
