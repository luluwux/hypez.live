import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      premiumLevel: number;
      isPremium: boolean;
      username?: string;
      displayName?: string;
      discordId?: string;
    } & DefaultSession["user"];
    apiToken?: string;
  }

  interface User {
    id: string;
    role: "USER" | "ADMIN";
    premiumLevel: number;
    isPremium: boolean;
    username?: string;
    displayName?: string;
    discordId?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
    premiumLevel: number;
    isPremium: boolean;
    username?: string;
    displayName?: string;
    discordId?: string;
    apiToken?: string;
    lastDiscordRoleCheck?: number;
  }
}
