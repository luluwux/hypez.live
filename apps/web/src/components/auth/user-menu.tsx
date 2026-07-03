"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { LayoutDashboard, User, LogOut, Globe, Check, ChevronLeft, ShieldAlert, Receipt, Bell, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { Session } from "next-auth";
import { useLanguage, useTranslation } from "@/lib/i18n/hooks";
import type { Language } from "@/lib/i18n/context";

const NSFW_STORAGE_KEY = "hypez-nsfw-enabled";

export function getNsfwPreference(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(NSFW_STORAGE_KEY) === "true";
}

export function useNsfwPreference() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        setEnabled(getNsfwPreference());
    }, []);

    const toggle = (v: boolean) => {
        setEnabled(v);
        localStorage.setItem(NSFW_STORAGE_KEY, String(v));
    };

    return { nsfwEnabled: enabled, setNsfwEnabled: toggle };
}

interface UserMenuProps {
    session: Session;
}

export function UserMenu({ session }: UserMenuProps) {
    const { language, setLanguage } = useLanguage();
    const { t } = useTranslation();
    const { nsfwEnabled, setNsfwEnabled } = useNsfwPreference();
    const [view, setView] = useState<"main" | "language">("main");

    const truncate = (str: string, length: number) => {
        return str.length > length ? str.substring(0, length) + "..." : str;
    };

    // Authorized Discord IDs for Dashboard access (from env or hardcoded)
    const authorizedDiscordIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
    const userDiscordId = session.user.id; // This is their Discord provider account ID
    const hasAdminAccess = session.user.role === "ADMIN" || authorizedDiscordIds.includes(userDiscordId);

    const languages: Array<{ code: Language; label: string; flag: string }> = [
        { code: "en", label: "English", flag: "🇬🇧" },
        { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    ];

    return (
        <DropdownMenu onOpenChange={(open) => !open && setView("main")}>
            <DropdownMenuTrigger className="focus:outline-none">
                <div className="relative group cursor-pointer">
                    {/* Avatar with Ring Effect */}
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-brand-500 transition-all duration-300">
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold">
                                {session.user.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                        )}
                    </div>
                    {/* Premium Badge Indicator */}
                    {session.user.premiumLevel > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-[#0f0f11] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-black">★</span>
                        </div>
                    )}
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 z-[1000]" sideOffset={12}>
                {view === "main" ? (
                    <>
                        {/* User Info Header */}
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-white">
                                    {session.user.name || "User"}
                                </p>
                                <p className="text-xs leading-none text-zinc-400">
                                    {truncate(session.user.email || "", 30)}
                                </p>
                                <p className="text-xs text-brand-400 font-medium mt-1">
                                    {session.user.premiumLevel === 1
                                        ? "Premium"
                                        : "Free Tier"}
                                </p>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {/* 1. Profil */}
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>{t('userMenu.profile')}</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* 2. Language */}
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                setView("language");
                            }}
                            className="cursor-pointer"
                        >
                            <Globe className="mr-2 h-4 w-4" />
                            <span>{t('userMenu.language')}</span>
                            <span className="ml-auto text-sm text-zinc-500">
                                {languages.find(l => l.code === language)?.flag}
                            </span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* 3. NSFW */}
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-zinc-300">{t('userMenu.nsfw')}</span>
                                </div>
                                <Switch
                                    checked={nsfwEnabled}
                                    onCheckedChange={setNsfwEnabled}
                                    className="data-[state=checked]:bg-red-500 scale-90"
                                />
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {/* 4. Yardım */}
                        <DropdownMenuItem asChild>
                            <Link href="/help" className="cursor-pointer">
                                <HelpCircle className="mr-2 h-4 w-4" />
                                <span>{t('userMenu.help')}</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* 5. Log Out */}
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="cursor-pointer text-red-400 focus:text-red-400"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('userMenu.logout')}</span>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        {/* Language Selection View */}
                        <DropdownMenuLabel className="font-normal">
                            <button
                                onClick={() => setView("main")}
                                className="flex items-center text-zinc-400 hover:text-white transition-colors w-full"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                <span>{t('userMenu.language')}</span>
                            </button>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {languages.map((lang) => (
                            <DropdownMenuItem
                                key={lang.code}
                                onClick={() => setLanguage(lang.code)}
                                className="cursor-pointer"
                            >
                                <span className="mr-2 text-base">{lang.flag}</span>
                                <span className="flex-1">{lang.label}</span>
                                {language === lang.code && <Check className="w-4 h-4 text-brand-500" />}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
