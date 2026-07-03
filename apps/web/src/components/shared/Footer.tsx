"use client";

import React from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Twitter, Github, Linkedin, Instagram, Youtube } from "lucide-react";
import { ShineBorder } from "@/components/lului/BorderShine";
import { useTranslation } from "@/lib/i18n/hooks";
import LightRays from "@/components/LightRays";

// Custom Discord Icon
const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
);

const socialLinks = [
    { icon: DiscordIcon, href: "#", label: "Discord" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "Github" },
    { icon: Linkedin, href: "#", label: "Linkedin" },
];

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="w-full text-white pt-20 pb-10 relative overflow-hidden">
            <div className="relative container mx-auto px-4 max-w-7xl">

                {/* CTA Banner */}
                <div className="relative w-full mb-24 isolate">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-[2px] bg-white/10  -z-10" />

                    <div className="relative w-full rounded-[40px] border-1 border-white/10 overflow-hidden bg-gradient-to-b from-[#000000] via-[#030303] to-[#070707] p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none" />

                        <div className="max-w-xl z-10 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 mb-2">
                                {t('footer.cta.title')}
                            </h2>
                            <p className="text-zinc-500 text-sm md:text-base">
                                {t('footer.cta.subtitle')}
                            </p>
                        </div>

                        <div className="z-10 flex flex-col sm:flex-row items-center gap-4">
                            <Button
                                variant="outline"
                                className="h-12 px-8 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all duration-300 font-medium text-base"
                                asChild
                            >
                                <a href="https://discord.com/oauth2/authorize?client_id=1167849489755811960&permissions=5630429932145857&integration_type=0&scope=bot+applications.commands" target="_blank" rel="noopener noreferrer">
                                    {t('common.addYourServer')}
                                </a>
                            </Button>

                            <div className="relative group">
                                <ShineBorder
                                    className="absolute inset-0 rounded-xl pointer-events-none"
                                    borderWidth={1.5}
                                    shineColor={["#3b82f6", "#06b6d4"]}
                                />
                                <Button
                                    variant="outline"
                                    className="relative h-12 px-8 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white transition-all duration-300 font-medium text-base z-10 overflow-hidden"
                                    asChild
                                >
                                    <a href="https://discord.gg/TD6JGgff5z" target="_blank" rel="noopener noreferrer">
                                        {t('common.supportServer')}
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* LightRays — starts exactly at CTA bottom edge, extends through HYPEZ */}
                    <div aria-hidden="true" className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 w-[1000px] h-[800px] pointer-events-none">
                        <LightRays
                            raysOrigin="top-center"
                            raysColor="#50a1ff"
                            raysSpeed={0.5}
                            lightSpread={0.5}
                            rayLength={1.0}
                            fadeDistance={1.0}
                            saturation={0.5}
                            followMouse={false}
                            mouseInfluence={0}
                            noiseAmount={0.08}
                        />
                    </div>
                </div>

                {/* Links Section — Brand (left) + Company + Legal (right) */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 pt-16 justify-between">

                    {/* Brand Column (Left) */}
                    <div className="lg:max-w-xs space-y-4">
                        <Link href="/" className="inline-block">
                            <h3 className="text-2xl font-bold text-white">
                                Hypez<span className="text-brand-500">.</span>
                            </h3>
                        </Link>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            {t('footer.brand.description')}
                        </p>

                        {/* Social Icons under brand description */}
                        <div className="flex items-center gap-3 pt-2">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        aria-label={social.label}
                                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Company + Legal (Right side) — stacks vertically on mobile */}
                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 lg:gap-14">
                        {/* Company */}
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-white text-sm">{t('footer.company.title')}</h4>
                            <ul className="flex flex-col gap-3 text-sm text-zinc-500">
                                <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.company.about')}</Link></li>
                                <li><Link href="/careers" className="hover:text-white transition-colors">{t('footer.company.careers')}</Link></li>
                                <li><Link href="/press" className="hover:text-white transition-colors">{t('footer.company.press')}</Link></li>
                                <li><Link href="/affiliates" className="hover:text-white transition-colors">{t('footer.company.affiliates')}</Link></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-white text-sm">{t('footer.legal.title')}</h4>
                            <ul className="flex flex-col gap-3 text-sm text-zinc-500">
                                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">{t('navbar.privacy')}</Link></li>
                                <li><Link href="/legal/terms" className="hover:text-white transition-colors">{t('navbar.terms')}</Link></li>
                                <li><Link href="/legal/cookie" className="hover:text-white transition-colors">{t('navbar.cookie')}</Link></li>
                                <li><Link href="/legal/content-policy" className="hover:text-white transition-colors">{t('navbar.contentPolicy')}</Link></li>
                                <li><Link href="/legal/sales-agreement" className="hover:text-white transition-colors">{t('navbar.salesAgreement')}</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>

            {/* Giant HYPEZ Branding */}
            <div className="w-full flex justify-center overflow-hidden pointer-events-none select-none pt-10">
                <p
                    className="text-[14vw] font-black tracking-[0.15em] uppercase leading-none text-transparent"
                    style={{
                        WebkitTextStroke: '2px rgb(255 255 255 / 0.25)',
                        maskImage: 'linear-gradient(to bottom, black 0%, black 15%, transparent 85%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 15%, transparent 85%)',
                    }}
                >
                    LUPPUX
                </p>
            </div>
        </footer>
    );
}
