"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Hash, TrendingUp, X, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Server } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

interface HeroSearchProps {
    onTagSelect?: (tag: string) => void;
    showTags?: boolean;
    servers: Server[];
}

export function HeroSearch({ onTagSelect, showTags = true, servers = [] }: HeroSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(""); // Arama metni
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { t } = useTranslation();

    // Filtreleme Mantığı
    const filteredServers = query
        ? servers.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
        : servers.slice(0, 6); // Show top 6 by default if no query? Or trending? For now just top 6.

    // Dışarı tıklama kontrolü
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // GELİŞMİŞ KLAVYE KONTROLÜ (Sağ/Sol Eklendi)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen && filteredServers.length > 0) {
            if (e.key === "Enter" || e.key === "ArrowDown") setIsOpen(true);
            return;
        }

        const maxIndex = filteredServers.length - 1;

        switch (e.key) {
            case "Escape":
                setIsOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;

            // Aşağı: 2 sütunlu grid olduğu için +2 ilerle (Grid mantığı)
            // Eğer liste kısaysa +1 gibi davranabilir, ama grid hissi için +2 deniyoruz.
            // Basitlik için LİNEER (Sırayla) gitmesini tercih edebiliriz.
            // Kullanıcı isteği: "Sağ ve Sol okları aktif kullan"

            case "ArrowDown":
                e.preventDefault();
                // Bir alt satıra geç (2 sütun varsa +2)
                setSelectedIndex(prev => (prev + 2 <= maxIndex ? prev + 2 : prev));
                break;

            case "ArrowUp":
                e.preventDefault();
                // Bir üst satıra geç (-2)
                setSelectedIndex(prev => (prev - 2 >= 0 ? prev - 2 : prev));
                break;

            case "ArrowRight":
                e.preventDefault();
                // Bir sağa git (+1)
                setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
                break;

            case "ArrowLeft":
                e.preventDefault();
                // Bir sola git (-1)
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
                break;

            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
                    router.push(`/servers/${filteredServers[selectedIndex]?.id}`);
                    setIsOpen(false);
                }
                break;
        }
    };

    return (
        <div ref={containerRef} className={cn("relative z-[500]", showTags ? "w-full max-w-5xl mx-auto" : "w-full")}>
            {/* SEARCH INPUT */}
            <div
                className={cn(
                    "relative flex items-center bg-white/[0.02] backdrop-blur-xl border transition-all duration-300 group shadow-2xl",
                    isOpen
                        ? "rounded-t-[24px] border-brand-500/50 bg-black/40"
                        : "rounded-[24px] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                )}
            >
                <div className="pl-6 pr-4">
                    <Search className={cn("w-6 h-6 transition-colors", isOpen ? "text-brand-500" : "text-gray-400")} />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                        setSelectedIndex(-1); // Arama değişince seçimi sıfırla
                    }}
                    placeholder={t('discover.search.placeholder')}
                    className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 h-20 pr-6 text-lg font-medium"
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />

                <div className="pr-4 flex items-center gap-2">
                    {isOpen || query ? (
                        <button onClick={() => { setIsOpen(false); setQuery(""); setSelectedIndex(-1); }} className="text-gray-500 hover:text-white transition-colors p-1">
                            <X className="w-5 h-5" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-black/40 backdrop-blur-xl border-x border-b border-white/10 rounded-b-[24px] shadow-2xl overflow-hidden flex flex-col z-[999] mt-0">
                    <div className="p-4">
                        {/* Başlık: Arama yapılıyorsa "Sonuçlar", boşsa "Trendler" */}
                        <div className="flex items-center gap-2 mb-3 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            {query ? <Search className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {query ? "Search Results" : "Trending Servers"}
                        </div>

                        {filteredServers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                No results found :/
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                                {filteredServers.map((server, index) => (
                                    <Link
                                        key={server.id}
                                        href={`/servers/${server.id}`}
                                        className={cn(
                                            "flex items-center gap-3 p-2 rounded-lg transition-all group",
                                            index === selectedIndex ? "bg-brand-500/10 border border-brand-500/20" : "hover:bg-white/5 border border-transparent"
                                        )}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        {/* Kare Logo */}
                                        <div className="shrink-0 w-11 h-11 bg-zinc-800 rounded-lg overflow-hidden relative border border-white/10 group-hover:border-white/20 flex items-center justify-center text-gray-400 font-bold">
                                            {server.icon ? (
                                                <DiscordIcon iconUrl={server.icon} name={server.name} cdnSize={64} width={44} height={44} className="w-full h-full object-cover" />
                                            ) : (
                                                server.name.charAt(0)
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 text-left">
                                            <h4 className={cn("text-sm font-semibold truncate", index === selectedIndex ? "text-brand-400" : "text-gray-200 group-hover:text-white")}>
                                                {server.name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <span className="text-yellow-500/80">★ {server.votes}</span>
                                            </div>
                                        </div>

                                        {index === selectedIndex && (
                                            <CornerDownLeft className="w-4 h-4 text-brand-500/50 mr-1" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-[#0e0f11] py-2 px-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-600 font-medium">
                        <div className="flex gap-4">
                            <span><kbd className="bg-white/5 px-1 rounded border border-white/10 text-[9px]">Arrow Keys</kbd> Navigate</span>
                            <span><kbd className="bg-white/5 px-1 rounded border border-white/10 text-[9px]">Enter</kbd> Select</span>
                        </div>
                        <span><kbd className="bg-white/5 px-1 rounded border border-white/10 text-[9px]">ESC</kbd> Close</span>
                    </div>
                </div>
            )}

            {/* Quick Tags (Under Search) */}
            {!isOpen && showTags && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 animate-fade-down" style={{ animationDelay: "0.1s" }}>
                    {["Gaming", "Social", "Fun", "Community", "Anime", "Roleplay", "Minecraft", "Music", "chill", "Roblox"].map((tag) => (
                        <button
                            key={tag}
                            onClick={() => onTagSelect?.(tag)}
                            className="px-4 py-2 bg-[#101113] border border-white/5 rounded-xl text-sky-400 text-sm font-medium hover:bg-sky-500/10 hover:border-sky-500/20 hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <span className="opacity-50 mr-1">#</span>{tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
