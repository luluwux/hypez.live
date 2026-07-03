"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
}

interface ServerTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export function ServerTabs({ tabs, activeTab, onTabChange, className }: ServerTabsProps) {
    return (
        <div className={cn("w-full bg-[#050505]/80 backdrop-blur-xl border-y border-white/5", className)}>
            <div className="container mx-auto max-w-7xl px-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "relative px-6 py-4 text-sm font-semibold transition-colors outline-none whitespace-nowrap",
                            activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeServerTab"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
