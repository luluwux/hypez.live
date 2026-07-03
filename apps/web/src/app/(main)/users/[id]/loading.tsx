import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfileLoading() {
  return (
    <div className="min-h-screen pb-20 pt-28">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">

        {/* Hero card skeleton */}
        <div className="rounded-2xl overflow-hidden border border-white/[0.06] mb-6 bg-gradient-to-b from-[#0a0a0a] to-[#060606]">
          {/* Banner */}
          <Skeleton className="h-36 md:h-44 w-full rounded-none bg-white/[0.04]" />
          {/* Info */}
          <div className="px-6 md:px-8 pb-6">
            <div className="flex items-end justify-between -mt-10 md:-mt-12">
              <div className="flex items-end gap-5">
                <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full ring-4 ring-[#060606] bg-white/[0.08] flex-shrink-0" />
                <div className="mb-1 space-y-2 hidden sm:block">
                  <Skeleton className="h-8 w-48 bg-white/5" />
                  <Skeleton className="h-4 w-32 bg-white/5" />
                </div>
              </div>
              <Skeleton className="h-8 w-32 rounded-lg bg-white/5 mb-1" />
            </div>
            <div className="mt-3 sm:hidden space-y-2">
              <Skeleton className="h-7 w-40 bg-white/5" />
              <Skeleton className="h-4 w-28 bg-white/5" />
            </div>
            <div className="flex gap-2 mt-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full bg-white/5" />
              ))}
            </div>
          </div>
        </div>

        <Skeleton className="h-4 w-28 mb-6 bg-white/5" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808] border border-white/5 rounded-xl p-5 space-y-3">
              <Skeleton className="h-3 w-16 bg-white/5" />
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full bg-white/5" />)}
            </div>
            <div className="bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808] border border-white/5 rounded-xl p-5 space-y-2">
              <Skeleton className="h-3 w-14 bg-white/5 mb-3" />
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg bg-white/5" />)}
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808] border border-white/5 rounded-xl p-6 space-y-3">
              <Skeleton className="h-3 w-20 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-5/6 bg-white/5" />
              <Skeleton className="h-4 w-4/6 bg-white/5" />
            </div>
            <div className="bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808] border border-white/5 rounded-xl p-6 space-y-3">
              <Skeleton className="h-3 w-24 bg-white/5 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/5" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
