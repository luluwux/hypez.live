"use client";

import { LoginButton } from "@/components/auth/login-button";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/hooks";

import Grid from "@/components/lului/Grid";
import { cn } from "@/lib/utils";

import React from 'react';

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { t } = useTranslation();
    const params = React.use(searchParams);
    const error = params?.error;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl z-20">
                    Error from NextAuth: {error}
                </div>
            )}


            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-[#0f0f11] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {t('login.welcome')} <span className="text-brand-500">Hypez</span>
                        </h1>
                        <p className="text-zinc-400">
                            {t('login.subtitle')}
                        </p>
                    </div>

                    {/* Login Button */}
                    <div className="flex justify-center w-full">
                        <LoginButton fullWidth />
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-zinc-500">
                        {t('login.agreement')}{" "}
                        <Link href="/legal/terms" className="text-brand-500 hover:underline">
                            {t('navbar.terms')}
                        </Link>{" "}
                        {t('login.and')}{" "}
                        <Link href="/legal/privacy" className="text-brand-500 hover:underline">
                            {t('navbar.privacy')}
                        </Link>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-zinc-500 text-sm">
                        {t('login.newTo')}{" "}
                        <Link href="/" className="text-brand-500 hover:underline font-medium">
                            {t('common.learnMore')}
                        </Link>
                    </p>
                </div>
            </div>


            {/* Background  */}
            
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
