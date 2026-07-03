import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import { ServerDetailClient } from "./client-page";
import type { Metadata } from 'next';
import { ServerStructuredData } from "@/lib/structured-data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    try {
        const server = await api.getServer(id);
        const iconUrl = server?.icon 
            ? `https://cdn.discordapp.com/icons/${id}/${server.icon}.png` 
            : null;

        return {
            title: server?.name ?? 'Server',
            description: server?.description ?? `Join ${server?.name} on Hypez`,
            openGraph: {
                title: `${server?.name} — Hypez`,
                description: server?.description ?? `Join ${server?.name} Discord server`,
                url: `https://hypez.live/servers/${id}`,
                images: iconUrl ? [{ url: iconUrl, width: 256, height: 256 }] : [],
            },
        };
    } catch (e) {
        return {
            title: 'Server',
            description: 'Join this server on Hypez',
        };
    }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const server = await api.getServer(id);
        if (!server) {
            return notFound();
        }

        return (
            <>
                <ServerStructuredData server={server} />
                <ServerDetailClient server={server} />
            </>
        );
    } catch (error) {
        console.error("Failed to fetch server:", error);
        return notFound();
    }
}
