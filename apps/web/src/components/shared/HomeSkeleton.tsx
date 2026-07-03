import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-lg bg-white/[0.04] animate-pulse", className)} />
    );
}

/** 200px card skeleton matching PremiumShowcase/Trending/NewlyAdded card size */
export function CardSkeleton() {
    return (
        <div className="w-full h-[200px] rounded-2xl bg-[#111214] border border-white/5 overflow-hidden">
            {/* Banner area */}
            <div className="relative h-[50%] bg-zinc-800/30">
                <Pulse className="absolute inset-0" />
                {/* Badge placeholder */}
                <Pulse className="absolute top-2 right-2 w-16 h-4 rounded-[4px]" />
                {/* Icon placeholder */}
                <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-[14px] bg-[#111214] p-1 shadow-lg">
                    <Pulse className="w-full h-full rounded-[10px]" />
                </div>
            </div>
            {/* Content area */}
            <div className="h-[50%] bg-[#111214] px-4 pb-3 pt-8 flex flex-col justify-end gap-2">
                <Pulse className="w-3/4 h-3" />
                <Pulse className="w-1/2 h-2" />
            </div>
        </div>
    );
}

/** 340px discover card skeleton */
export function DiscoverCardSkeleton() {
    return (
        <div className="w-full h-[340px] rounded-3xl bg-zinc-800 border border-white/5 overflow-hidden">
            <div className="relative h-[150px] bg-zinc-800/50">
                <Pulse className="absolute inset-0" />
            </div>
            <div className="h-[190px] bg-[#111214] rounded-t-[24px] px-5 pb-5 pt-0 -mt-4 relative border-t border-white/5">
                <div className="-mt-8 mb-2">
                    <div className="w-16 h-16 rounded-[18px] p-1 bg-[#111214]">
                        <Pulse className="w-full h-full rounded-[14px]" />
                    </div>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                    <Pulse className="w-1/2 h-5" />
                    <Pulse className="w-16 h-5 rounded-full" />
                </div>
                <div className="space-y-1.5 mb-4">
                    <Pulse className="w-full h-3" />
                    <Pulse className="w-2/3 h-3" />
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <Pulse className="w-16 h-5 rounded-full" />
                    <Pulse className="w-14 h-7 rounded-full" />
                </div>
            </div>
        </div>
    );
}

/** TopList column skeleton */
export function TopListSkeleton() {
    return (
        <div className="flex flex-col bg-[#111214] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <Pulse className="w-24 h-4" />
                <Pulse className="w-12 h-3" />
            </div>
            <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.03] last:border-b-0">
                        <Pulse className="w-4 h-4" />
                        <Pulse className="w-8 h-8 rounded-lg" />
                        <Pulse className="flex-1 h-3" />
                        <Pulse className="w-12 h-3" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Full section skeleton with header + grid */
export function SectionSkeleton({ cards = 4, variant = "card" }: { cards?: number; variant?: "card" | "discover" }) {
    const CardComponent = variant === "discover" ? DiscoverCardSkeleton : CardSkeleton;
    const gridCols = variant === "discover" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

    return (
        <div className={cn("grid", gridCols, "gap-4")}>
            {Array.from({ length: cards }).map((_, i) => (
                <CardComponent key={i} />
            ))}
        </div>
    );
}
