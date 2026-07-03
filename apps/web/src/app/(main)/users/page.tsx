import { api } from "@/lib/api";
import type { Metadata } from "next";
import { UsersListClient } from "./client-page";

import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    
    const title = locale === 'tr' ? "Kullanıcılar - Hypez" : "All Users - Hypez";
    const description = locale === 'tr' 
        ? "Hypez üzerindeki tüm kullanıcıları keşfet ve profillerini incele." 
        : "Discover registered and publicly visible users on the Hypez platform.";

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: "https://hypez.live/users",
            siteName: "Hypez",
        },
    };
}

export default async function UsersPage() {
    const users = await api.getUsers();

    return <UsersListClient users={users} />;
}
