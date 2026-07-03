import { Server } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

interface PremiumBadgeProps {
    tier: 'PREMIUM';
    className?: string;
}

export function PremiumBadge({ tier, className }: PremiumBadgeProps) {
    return (
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md border bg-sky-500 text-black border-sky-500 ${className || ''}`}>
            <Crown className="w-3 h-3" />
            Premium
        </div>
    );
}
