"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { type UserProfile } from "@/lib/api";
import Image from "next/image";
import { UserBadges } from "@/components/user/UserBadges";
import { Heart, Eye, Calendar, Share2, ExternalLink, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UsersListClientProps {
    users: UserProfile[];
}

function UserCard({ user }: { user: UserProfile }) {
    const { t } = useTranslation();

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const copyLink = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}/users/${user.id}`);
        toast.success("Link kopyalandı!");
    };
    
    // Determine gradient for banner fallback
    const fallbackGradients = [
        "from-indigo-500 to-purple-600",
        "from-blue-500 to-cyan-500",
        "from-rose-500 to-orange-500",
        "from-emerald-400 to-cyan-400",
        "from-fuchsia-500 to-pink-500"
    ];
    const hash = user.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fallbackBanner = fallbackGradients[hash % fallbackGradients.length];

    return (
        <div className="group flex flex-col rounded-3xl bg-gradient-to-b from-[#020202] via-[#040404] to-[#070707] border border-white/[0.04] overflow-hidden hover:border-white/10 transition-all duration-300">
            {/* Banner Section */}
            <div className={`h-[100px] w-full relative ${!user.banner && 'bg-gradient-to-r ' + fallbackBanner}`}>
                {user.banner && (
                    <Image 
                        src={user.banner} 
                        alt="banner" 
                        width={600}
                        height={100}
                        className="w-full h-full object-cover"
                        unoptimized
                    />
                )}
                {/* Banner Gradient Overlay for seamless transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] to-transparent opacity-90" />
            </div>

            {/* Content Section */}
            <div className="px-5 pb-5 flex flex-col relative -mt-8">
                
                {/* Avatar */}
                <div className="relative mb-3">
                    <div className="w-[72px] h-[72px] rounded-full bg-[#020202] p-1">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800">
                            {user.image ? (
                                <Image 
                                    src={user.image} 
                                    alt={user.name ?? "User"} 
                                    width={72}
                                    height={72}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl bg-brand-500">
                                    {user.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Name & Badges */}
                <div className="flex items-center gap-1.5 mb-0.5 mt-1">
                    <h3 className="text-lg font-bold text-white leading-none">{user.name}</h3>
                    <UserBadges user={user as any} className="scale-75 origin-left" />
                </div>
                
                {/* Username handle */}
                <p className="text-[13px] text-zinc-400 mb-4 font-medium">@{user.name?.toLowerCase().replace(/\s+/g, '')}</p>

                {/* About Me */}
                <div className="mb-5 flex-1">
                    <h4 className="text-[13px] text-zinc-300 font-semibold mb-1.5">{t('users.card.about')}</h4>
                    <p className="text-[13px] text-zinc-400 line-clamp-2 leading-relaxed h-[40px]">
                        {user.about || t('users.card.noAbout')}
                    </p>
                </div>

                {/* Footer Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/5 mb-2">
                    <div>
                        <p className="text-[12px] text-zinc-400 font-medium mb-0.5">{t('users.card.likes')}</p>
                        <p className="text-[13px] text-white font-bold">{user.likeCount}</p>
                    </div>
                    <div>
                        <p className="text-[12px] text-zinc-400 font-medium mb-0.5">{t('users.card.views')}</p>
                        <p className="text-[13px] text-white font-bold">{user.profileViews}</p>
                    </div>
                    <div>
                        <p className="text-[12px] text-zinc-400 font-medium mb-0.5">{t('users.card.created')}</p>
                        <p className="text-[13px] text-white font-bold truncate">{formatDate(user.createdAt)}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-1">
                    <Link 
                        href={`/users/${user.id}`}
                        className="flex items-center justify-center gap-1.5 flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all text-[13px]"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {t('users.card.visit')}
                    </Link>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard.writeText(`${window.location.origin}/users/${user.id}`);
                            toast.success(t('users.card.linkCopied'));
                        }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-zinc-300 font-medium rounded-xl transition-colors text-[13px]"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        {t('users.card.share')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function UsersListClient({ users }: UsersListClientProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest"); // newest, oldest, likes, views

    const filteredUsers = useMemo(() => {
        let result = users.filter(u => 
            (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
            (u.about || "").toLowerCase().includes(search.toLowerCase())
        );

        result.sort((a, b) => {
            if (sortBy === "likes") return b.likeCount - a.likeCount;
            if (sortBy === "views") return b.profileViews - a.profileViews;
            if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            // newest is default
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return result;
    }, [users, search, sortBy]);

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center pt-28 pb-20">
            {/* HERO SEARCH AREA */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 md:px-8 w-full max-w-7xl mx-auto mt-10 mb-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-2xl mb-4">
                    {t('users.hero.title')}
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                    {t('users.hero.subtitle')}
                </p>
                <div className="w-full max-w-2xl relative group mb-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input 
                        type="text"
                        placeholder={t('users.filters.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-zinc-900/50 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-brand-500 shadow-xl transition-all text-lg"
                    />
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                {/* FILTER BAR */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#09090b] border border-white/5 shadow-2xl rounded-2xl p-3 md:px-5 mb-8">
                    <div className="flex items-center px-2 w-full md:w-auto">
                        <span className="text-zinc-400 text-sm font-medium">
                            {t('users.filters.found').replace('{count}', filteredUsers.length.toString())}
                        </span>
                    </div>

                    <div className="w-full md:w-48">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full bg-[#18181b] border-white/10 text-zinc-200">
                                <SelectValue placeholder={t('users.filters.sortBy')} />
                            </SelectTrigger>
                            <SelectContent className="bg-[#18181b] border-white/10">
                                <SelectItem value="newest" className="focus:bg-white/5 cursor-pointer">
                                    {t('users.filters.sort.newest')}
                                </SelectItem>
                                <SelectItem value="oldest" className="focus:bg-white/5 cursor-pointer">
                                    {t('users.filters.sort.oldest')}
                                </SelectItem>
                                <SelectItem value="likes" className="focus:bg-white/5 cursor-pointer">
                                    {t('users.filters.sort.likes')}
                                </SelectItem>
                                <SelectItem value="views" className="focus:bg-white/5 cursor-pointer">
                                    {t('users.filters.sort.views')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Grid */}
                {filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUsers.map(user => (
                            <UserCard key={user.id} user={user} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-white/5">
                        <p className="text-zinc-500">Kullanıcı bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
