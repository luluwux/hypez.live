"use client";

import { User, Receipt, Bell, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/hooks";

const sidebarLinks = [
    { href: "/profile", labelKey: "profile.layout.myProfile", icon: User },
    // { href: "/profile/billing", labelKey: "Faturalar", icon: Receipt },
    { href: "/profile/settings", labelKey: "profile.layout.settings", icon: Settings },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <div className="container max-w-7xl mx-auto py-12 px-4 md:px-6 mt-16 min-h-[calc(100vh-200px)]">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="sticky top-28 bg-zinc-950/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">{t('profile.layout.accountManagement')}</h2>
                        {sidebarLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-brand-500/10 text-brand-400"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "text-brand-400" : "text-zinc-500")} />
                                    {t(link.labelKey)}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
