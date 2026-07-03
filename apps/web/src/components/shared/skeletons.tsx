import { Skeleton } from "@/components/ui/skeleton";

// 1. Hype Showcase Skeleton (4 cards)
export function HypeSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-[#151618] border border-white/5 overflow-hidden relative">
                    <Skeleton className="w-full h-full bg-zinc-800/50" />
                    {/* Shimmer overlay is built-in to Shadcn Skeleton (animate-pulse) */}
                </div>
            ))}
        </div>
    );
}

// 2. Category Skeleton (Row of pills)
export function CategorySkeleton() {
    return (
        <div className="flex gap-2 overflow-hidden mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full bg-zinc-900 border border-white/5" />
            ))}
        </div>
    );
}

// 3. Server Card Skeleton (Already exists in separate file, but can be exported here if unified)
// (We will use the existing ServerCardSkeleton component for the grid)
