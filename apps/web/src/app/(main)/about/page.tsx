import { Card } from "@/components/ui/card";

export default function AboutPage() {
    return (
        <div className="container max-w-7xl mx-auto pt-48 pb-24 px-4">
            <h1 className="text-4xl font-bold text-white mb-8 text-center md:text-left">About Hypez</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 bg-zinc-950/50 border-white/5 flex flex-col justify-center">
                    <h2 className="text-2xl font-semibold text-brand-400 mb-4">Our Mission</h2>
                    <p className="text-zinc-400 leading-relaxed mb-4">
                        Hypez is a premier Discord server list and community directory built with a single goal in mind: 
                        to bridge the gap between amazing communities and the people looking for them. 
                    </p>
                    <p className="text-zinc-400 leading-relaxed">
                        Whether you're a gamer, developer, artist, or just someone looking to chat, our platform ensures 
                        you find the perfect server tailored to your interests. We empower server owners with the tools 
                        they need to grow, thrive, and reach their target audience effectively.
                    </p>
                </Card>

                <Card className="p-8 bg-zinc-950/50 border-white/5 flex flex-col justify-center">
                    <h2 className="text-2xl font-semibold text-brand-400 mb-4">Why Choose Us?</h2>
                    <ul className="space-y-4 text-zinc-400">
                        <li className="flex gap-3 items-start">
                            <span className="text-brand-500 font-bold mt-1">•</span>
                            <span><strong>Advanced Discovery:</strong> Powerful search filters, categories, and tags to easily pinpoint exactly what you're looking for.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="text-brand-500 font-bold mt-1">•</span>
                            <span><strong>Real-Time Analytics:</strong> We provide detailed insights into server activity, online members, and engagement metrics.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="text-brand-500 font-bold mt-1">•</span>
                            <span><strong>Fair Voting System:</strong> A transparent ranking algorithm that rewards active and engaging communities, putting quality first.</span>
                        </li>
                    </ul>
                </Card>
            </div>

            <div className="mt-8">
                <Card className="p-8 bg-gradient-to-r from-brand-500/10 to-sky-500/10 border-brand-500/20 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Join the Ecosystem</h2>
                    <p className="text-zinc-300 max-w-2xl mx-auto mb-6">
                        Hypez isn't just a list—it's a community of communities. By adding your server or bot to our directory, 
                        you become part of a continuously growing network of creators and enthusiasts.
                    </p>
                </Card>
            </div>
        </div>
    );
}
