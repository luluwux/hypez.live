"use client";

import { useSession } from "next-auth/react";
import { GuestMenu } from "@/components/auth/guest-menu";
import { UserMenu } from "@/components/auth/user-menu";

export function UserButtonClient() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
        );
    }

    if (!session?.user) {
        return <GuestMenu />;
    }

    return <UserMenu session={session} />;
}
