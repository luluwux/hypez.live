'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import Grid from '@/components/lului/Grid';
import { cn } from '@/lib/utils';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Error Boundary]', error);
    }, [error]);

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1 flex items-center justify-center relative overflow-hidden pt-48 pb-16">
                <div className="relative z-10 flex flex-col items-center text-center px-6">
                    {/* Giant 404 (or Error equivalent) could go here if wanted, but skipping since it's an error */}

                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Something went wrong
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-sm mb-2">
                        An unexpected error occurred while loading this page.
                    </p>
                    {error.digest && (
                        <p className="text-xs text-zinc-600 font-mono mb-8">
                            Error ID: {error.digest}
                        </p>
                    )}
                    {!error.digest && <div className="mb-8" />}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={reset}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-zinc-100 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try again
                        </button>
                        <Link href="/">
                            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors">
                                <Home className="w-4 h-4" />
                                Go home
                            </div>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Background */}
            <div aria-hidden="true" className="hidden lg:block absolute top-0 w-[1000px] z-[-1] h-[400px] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A4A4A3, transparent 50%)' }}>
            </div>
            <div className="absolute inset-x-0 -top-40 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none -z-50 opacity-50" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3388ff] to-[#3388ff] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 0% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 61.1%, 1.5% 38.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 25.1% 97.7%, 70.1% 44.1%)" }}>
                </div>
            </div>
            <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)] opacity-50" aria-hidden="true">
                <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2  bg-gradient-to-tr from-[#3388ff] to-[#3388ff] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 100.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 71.1% 44.1%)" }}>
                </div>
            </div>
            <div className="color-layout layout-purple position-right-top fixed"></div>

            <Grid
                width={150}
                height={150}
                x={-1}
                y={-1}
                strokeDasharray={"0 0"}
                className={cn(
                    "[mask-image:radial-gradient(1200px_circle_at_top_center,white,transparent)] -z-50 opacity-30",
                )}
            />
        </div>
    );
}
