import { Skeleton } from "@/components/ui/skeleton";

export function ServerCardSkeleton() {
    return (
        <div className="group relative bg-[#151618] rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full min-h-[350px]">
            {/* Banner Skeleton */}
            <div className="h-32 w-full relative">
                <Skeleton className="w-full h-full bg-zinc-800" />
            </div>

            {/* Content Container */}
            <div className="p-4 flex flex-col flex-1 relative">
                {/* Icon Skeleton - Positioned to overlap banner */}
                <div className="absolute -top-10 left-4">
                    <Skeleton className="w-20 h-20 rounded-2xl bg-zinc-700 border-4 border-[#151618]" />
                </div>

                {/* Header Spacer */}
                <div className="mt-10 mb-2 flex justify-end">
                    {/* Stats Skeleton */}
                    <Skeleton className="h-4 w-24 bg-zinc-800" />
                </div>

                {/* Title Skeleton */}
                <Skeleton className="h-8 w-3/4 mb-2 bg-zinc-800" />

                {/* Description Skeleton */}
                <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full bg-zinc-800/50" />
                    <Skeleton className="h-4 w-5/6 bg-zinc-800/50" />
                </div>

                {/* Tags Skeleton */}
                <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-16 rounded-md bg-zinc-800" />
                    <Skeleton className="h-6 w-16 rounded-md bg-zinc-800" />
                </div>

                {/* Footer Spacer */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <Skeleton className="h-4 w-20 bg-zinc-800" />
                    <Skeleton className="h-9 w-24 rounded-lg bg-zinc-800" />
                </div>
            </div>
        </div>
    );
}
