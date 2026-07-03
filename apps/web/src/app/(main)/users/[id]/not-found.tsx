import Link from 'next/link';
import { Home, Server } from 'lucide-react';

export default function UserNotFound() {
    return (
        <div className="flex flex-col items-center justify-center pt-48 pb-16 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                {/* Giant 404 */}
                <div className="relative mb-6">
                    <span className="text-[160px] md:text-[220px] font-black bg-clip-text text-transparent bg-gradient-to-b from-white/20 to-white/5 leading-none select-none">
                        404
                    </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    User not found
                </h1>
                <p className="text-zinc-400 text-lg max-w-sm mb-10">
                    This profile doesn't exist or is not public.
                </p>

                <div className="flex items-center gap-3">
                    <Link href="/">
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-zinc-100 transition-colors">
                            <Home className="w-4 h-4" />
                            Back to home
                        </div>
                    </Link>
                    <Link href="/servers">
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors">
                            <Server className="w-4 h-4" />
                            Discover Servers
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
