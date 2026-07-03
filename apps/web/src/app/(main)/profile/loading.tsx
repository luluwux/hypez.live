import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSettingsLoading() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Skeleton className="h-4 w-24 mb-8 bg-white/5" />
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2 bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
