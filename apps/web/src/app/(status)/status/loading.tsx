import { Skeleton } from "@/components/ui/skeleton"

export default function StatusLoading() {
    return (
        <main className="min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
                {/* Header */}
                <div className="flex flex-col items-center gap-4 pb-10 border-b border-white/5">
                    <Skeleton className="w-16 h-16 rounded-full bg-white/5" />
                    <Skeleton className="h-8 w-64 bg-white/5" />
                    <Skeleton className="h-4 w-40 bg-white/5" />
                </div>

                {/* Monitor cards */}
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-[#111213] border border-white/5 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-9 h-9 rounded-xl bg-white/5" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-28 bg-white/5" />
                                        <Skeleton className="h-3 w-36 bg-white/5" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
                            </div>
                            <Skeleton className="h-7 w-full mt-3 rounded-sm bg-white/5" />
                            <div className="flex justify-between mt-1.5">
                                <Skeleton className="h-2 w-16 bg-white/5" />
                                <Skeleton className="h-2 w-10 bg-white/5" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Incidents */}
                <div>
                    <Skeleton className="h-4 w-32 mb-4 bg-white/5" />
                    <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                </div>
            </div>
        </main>
    )
}
