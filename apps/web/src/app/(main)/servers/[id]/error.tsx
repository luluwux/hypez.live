'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ServerDetailError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Server Detail Error]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
                Sunucu yüklenemedi
            </h1>
            <p className="text-zinc-400 max-w-sm mb-2">
                Bu sunucu sayfası yüklenirken beklenmedik bir hata oluştu.
            </p>
            {error.digest && (
                <p className="text-xs text-zinc-600 font-mono mb-6">
                    Hata ID: {error.digest}
                </p>
            )}
            {!error.digest && <div className="mb-6" />}

            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-zinc-100 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Tekrar dene
                </button>
                <Link href="/servers">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Sunuculara dön
                    </div>
                </Link>
            </div>
        </div>
    );
}
