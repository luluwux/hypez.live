import { type DefaultSession } from "next-auth";
import { type JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "USER" | "ADMIN";
            premiumLevel: number;
            username?: string;
            discordId?: string;
        } & DefaultSession["user"];
        apiToken?: string;
    }

    interface User {
        id: string;
        role: "USER" | "ADMIN";
        premiumLevel: number;
        username?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "USER" | "ADMIN";
        premiumLevel: number;
        username?: string;
        discordId?: string;
        apiToken?: string;
        picture?: string;
        lastDiscordRoleCheck?: number;
    }
}
