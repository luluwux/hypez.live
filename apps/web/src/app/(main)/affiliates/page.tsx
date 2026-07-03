import { Card } from "@/components/ui/card";

export default function AffiliatesPage() {
    return (
        <div className="container max-w-7xl mx-auto pt-48 pb-24 px-4">
            <h1 className="text-4xl font-bold text-white mb-6">Affiliates Program</h1>
            <Card className="p-8 bg-zinc-950/50 border-white/5">
                <h2 className="text-xl font-semibold text-white mb-4">Partner With Us</h2>
                <p className="text-zinc-400 leading-relaxed mb-4">
                    Our affiliate program is currently under development. Soon you will be able to earn rewards by referring servers and users to Hypez.
                </p>
                <p className="text-zinc-500 text-sm">
                    Stay tuned for more updates!
                </p>
            </Card>
        </div>
    );
}
