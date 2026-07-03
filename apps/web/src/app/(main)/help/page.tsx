"use client";

import { Card } from "@/components/ui/card";
import { HelpCircle, MessagesSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n/hooks";

const CARD = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";

const faqKeys = ["q1", "q2", "q3", "q4", "q5"];

export default function HelpPage() {
    const { t } = useTranslation();

    return (
        <div className="container max-w-7xl mx-auto pt-32 pb-16 px-4 md:px-6">
            <div className="text-center mb-12 space-y-4">
                <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <HelpCircle className="w-8 h-8 text-brand-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{t('help.title')}</h1>
                <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                    {t('help.subtitle')}
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card className={`${CARD} border border-white/5 p-6 col-span-1 md:col-span-2`}>
                    <h2 className="text-xl font-bold text-white mb-6">{t('help.faqTitle')}</h2>
                    <Accordion type="single" collapsible className="w-full">
                        {faqKeys.map((key, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border-white/5">
                                <AccordionTrigger className="text-left text-sm font-semibold hover:text-brand-400 hover:no-underline">
                                    {t(`help.${key}.question` as any)}
                                </AccordionTrigger>
                                <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                    {t(`help.${key}.answer` as any)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Card>

                <div className="col-span-1 space-y-6">
                    <Card className="bg-brand-500 border border-brand-400 p-6 flex flex-col justify-between overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                            <MessagesSquare className="w-32 h-32 text-black" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-2">{t('help.supportServer')}</h3>
                            <p className="text-sm text-brand-100 mb-6 leading-relaxed">
                                {t('help.supportDesc')}
                            </p>
                            <Link href="https://discord.gg/TD6JGgff5z" className="inline-flex w-full">
                                <button className="w-full bg-white text-brand-600 hover:bg-zinc-100 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                                    {t('help.joinServer')} <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    </Card>

                    <Card className={`${CARD} border border-white/5 p-6`}>
                        <h3 className="text-sm font-bold text-white mb-3">{t('help.otherLinks')}</h3>
                        <div className="space-y-2">
                            <Link href="/legal/terms" className="block text-sm text-zinc-400 hover:text-white transition-colors">
                                {t('help.termsOfUse')}
                            </Link>
                            <Link href="/legal/privacy" className="block text-sm text-zinc-400 hover:text-white transition-colors">
                                {t('help.privacyPolicy')}
                            </Link>
                            <a href="https://discord.com/oauth2/authorize?client_id=1167849489755811960&permissions=5630429932145857&integration_type=0&scope=bot+applications.commands" target="_blank" rel="noopener noreferrer" className="block text-sm text-zinc-400 hover:text-white transition-colors">
                                {t('help.inviteBot')}
                            </a>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
