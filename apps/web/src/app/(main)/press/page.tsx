import { Card } from "@/components/ui/card";

export default function PressPage() {
    return (
        <div className="container max-w-7xl mx-auto pt-48 pb-24 px-4">
            <h1 className="text-4xl font-bold text-white mb-6">Press & Media</h1>
            <Card className="p-8 bg-zinc-950/50 border-white/5">
                <p className="text-zinc-400 leading-relaxed mb-6">
                    For press inquiries, brand assets, and media related questions, please contact our PR team.
                </p>
                <div className="bg-white/5 rounded-lg p-4 inline-block">
                    <span className="text-white font-medium">Email: </span>
                    <a href="mailto:press@hypez.live" className="text-brand-400 hover:text-brand-300">press@hypez.live</a>
                </div>
            </Card>
        </div>
    );
}
