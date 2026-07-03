import { Card } from "@/components/ui/card";

export default function CareersPage() {
    return (
        <div className="container max-w-7xl mx-auto pt-48 pb-24 px-4">
            <h1 className="text-4xl font-bold text-white mb-6">Careers</h1>
            <Card className="p-8 bg-zinc-950/50 border-white/5 text-center py-20">
                <h3 className="text-xl font-medium text-white mb-2">No Open Positions</h3>
                <p className="text-zinc-400">
                    We currently don't have any open positions. Please check back later or follow our social media channels for updates.
                </p>
            </Card>
        </div>
    );
}
