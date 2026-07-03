"use client";

import { cn } from "@/lib/utils"
import { CategoryIcon } from "@/components/ui/category-icon";
import { Flame, Users, Star, Clock, Hash } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FALLBACK_CATEGORIES } from "@hypez/shared-types";

const SORT_OPTIONS = [
    { id: "votes", name: "En Çok Oy", icon: Star },
    { id: "members", name: "En Çok Üye", icon: Users },
    { id: "hype", name: "Hype Liderleri", icon: Flame },
    { id: "newest", name: "Yeni Eklenenler", icon: Clock },
];

export function FilterSidebar() {
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "votes";
    const currentCategory = searchParams.get("category");

    return (
        <div className="w-full lg:w-64 flex-shrink-0 space-y-8">

            {/* 1. SIRALAMA (SORT) */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                    Sıralama Ölçütü
                </h3>
                <div className="space-y-1">
                    {SORT_OPTIONS.map((option) => (
                        <Link
                            key={option.id}
                            href={`/servers?sort=${option.id}${currentCategory ? `&category=${currentCategory}` : ""}`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm",
                                currentSort === option.id
                                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <option.icon className="w-4 h-4" />
                            {option.name}
                        </Link>
                    ))}
                </div>
            </div>

            <hr className="border-white/5" />

            {/* 2. KATEGORİLER (FILTER) */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                    Kategoriler
                </h3>
                <div className="flex flex-wrap gap-2 px-1">
                    {FALLBACK_CATEGORIES.filter(c => c.isActive).map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/servers?category=${cat.id}${currentSort ? `&sort=${currentSort}` : ""}`}
                            className={cn(
                                "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                                currentCategory === cat.id
                                    ? "bg-white text-black border-white"
                                    : "bg-zinc-900 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                            )}
                        >
                            <CategoryIcon name={cat.emoji} className="w-3.5 h-3.5 mr-2 inline-block" /> {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}
