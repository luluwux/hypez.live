import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAdminRoute = nextUrl.pathname.startsWith("/admin");

            if (isAdminRoute) {
                if (!isLoggedIn) {
                    return Response.redirect(new URL("/", nextUrl));
                }
                const role = (auth?.user as { role?: string } | undefined)?.role;
                if (role !== "ADMIN") {
                    return Response.redirect(new URL("/", nextUrl));
                }
            }
            return true;
        },
        session({ session, token }) {
            if (session.user && token.role) {
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    providers: [],
    session: { strategy: "jwt" as const },
    secret: process.env.AUTH_SECRET,
    trustHost: true,
} satisfies NextAuthConfig;
