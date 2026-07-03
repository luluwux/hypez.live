"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

import { useTranslation } from "@/lib/i18n/hooks";

export function FAQ() {
    const { t } = useTranslation();

    return (
        <div className="w-full max-w-7xl mx-auto px-4 mb-20">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-10 ">
                <div className="bg-brand-500/10 p-2 rounded-xl border border-brand-500/20 mb-4">
                    <HelpCircle className="w-6 h-6 text-brand-500" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-sky-300 mb-4">
                    {t('home.faq.title')}
                </h2>
                <p className="text-zinc-400 max-w-lg">
                    {t('home.faq.subtitle')}
                </p>
            </div>

            {/* Accordion */}
            <Accordion type="single" collapsible className="w-full space-y-4">

                <AccordionItem value="item-1" className="border border-white/5 rounded-2xl px-6 bg-gradient-to-b from-[#020202] via-[#040404] to-[#070707] overflow-hidden data-[state=open]:border-brand-500/30 transition-colors">
                    <AccordionTrigger className="text-white hover:text-brand-400 hover:no-underline text-lg font-medium py-6">
                        {t('home.faq.q1.question')}
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-400 text-base leading-relaxed pb-6">
                        {t('home.faq.q1.answer')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border border-white/5 rounded-2xl px-6 bg-gradient-to-b from-[#020202] via-[#040404] to-[#070707] overflow-hidden data-[state=open]:border-brand-500/30 transition-colors">
                    <AccordionTrigger className="text-white hover:text-brand-400 hover:no-underline text-lg font-medium py-6">
                        {t('home.faq.q2.question')}
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-400 text-base leading-relaxed pb-6">
                        {t('home.faq.q2.answer')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border border-white/5 rounded-2xl px-6 bg-gradient-to-b from-[#020202] via-[#040404] to-[#070707] overflow-hidden data-[state=open]:border-brand-500/30 transition-colors">
                    <AccordionTrigger className="text-white hover:text-brand-400 hover:no-underline text-lg font-medium py-6">
                        {t('home.faq.q3.question')}
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-400 text-base leading-relaxed pb-6">
                        {t('home.faq.q3.answer')}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border border-white/5 rounded-2xl px-6 bg-gradient-to-b from-[#020202] via-[#040404] to-[#070707] overflow-hidden data-[state=open]:border-brand-500/30 transition-colors">
                    <AccordionTrigger className="text-white hover:text-brand-400 hover:no-underline text-lg font-medium py-6">
                        {t('home.faq.q4.question')}
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-400 text-base leading-relaxed pb-6">
                        {t('home.faq.q4.answer')}
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
}
