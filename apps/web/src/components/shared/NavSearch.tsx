"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, CornerDownLeft, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api, Server } from "@/lib/api";

export function NavSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const [mounted, setMounted] = useState(false);
    const [servers, setServers] = useState<Server[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Fetch real servers for search
        const loadServers = async () => {
            try {
                const data = await api.getServers();
                // Filter out mock/broken data if needed, ensuring IDs exist
                setServers(data.filter(s => s.id));
            } catch (error) {
                console.error("NavSearch failed to load servers", error);
            }
        };
        loadServers();
    }, []);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    const filteredServers = query
        ? servers.filter(s => s.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
        : servers.slice(0, 5);

    // Handle clicks outside - updated to check dropdown portal
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            // Check if click is inside container OR inside the dropdown portal
            const dropdown = document.getElementById("nav-search-dropdown");

            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                dropdown &&
                !dropdown.contains(target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update position on scroll/resize/open
    useEffect(() => {
        const updatePosition = () => {
            if (containerRef.current && isOpen) {
                const rect = containerRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 12,
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        if (isOpen) {
            updatePosition();
            window.addEventListener("scroll", updatePosition);
            window.addEventListener("resize", updatePosition);
        }

        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

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
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
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
        <div ref={containerRef} className="relative w-full">
            {/* SEARCH INPUT */}
            <div
                className={cn(
                    "relative flex items-center bg-white/5 border transition-all duration-200 group h-10 w-full",
                    isOpen
                        ? "rounded-t-xl rounded-b-md border-brand-500/50 bg-[#1a1b1e]"
                        : "rounded-xl border-white/10 hover:border-white/20 hover:bg-white/10"
                )}
            >
                <div className="pl-3 pr-2">
                    <Search className={cn("w-4 h-4 transition-colors", isOpen ? "text-brand-500" : "text-gray-400")} />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                        setSelectedIndex(-1);
                    }}
                    placeholder="Search servers..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 text-sm font-medium h-full pr-8"
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />

                <div className="absolute right-2 flex items-center">
                    {isOpen || query ? (
                        <button onClick={() => { setIsOpen(false); setQuery(""); setSelectedIndex(-1); }} className="text-gray-500 hover:text-white transition-colors p-1">
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="pointer-events-none hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-gray-500 font-mono">
                            CTRL K
                        </div>
                    )}
                </div>
            </div>

            {/* PORTAL DROPDOWN MENU */}
            {isOpen && mounted && createPortal(
                <div
                    id="nav-search-dropdown"
                    className="fixed z-[9999] bg-[#121315] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-md"
                    style={{
                        top: menuPosition.top,
                        left: menuPosition.left,
                        width: menuPosition.width
                    }}
                >
                    <div className="p-2">
                        <div className="flex items-center gap-2 mb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {query ? <Search className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {query ? "Results" : "Trending"}
                        </div>

                        {filteredServers.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-xs">
                                No results found.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
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
                                        <div className="shrink-0 w-8 h-8 bg-zinc-800 rounded-md overflow-hidden relative border border-white/10 flex items-center justify-center text-gray-400 font-bold text-xs">
                                            {server.name.charAt(0)}
                                        </div>

                                        <div className="flex-1 min-w-0 text-left">
                                            <h4 className={cn("text-xs font-semibold truncate", index === selectedIndex ? "text-brand-400" : "text-gray-200 group-hover:text-white")}>
                                                {server.name}
                                            </h4>
                                        </div>

                                        {index === selectedIndex && (
                                            <CornerDownLeft className="w-3 h-3 text-brand-500/50 mr-1" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
