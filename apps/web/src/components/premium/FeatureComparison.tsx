"use client";

import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/hooks";

export function FeatureComparison() {
    const { t } = useTranslation();

    const FEATURES = [
        { name: t("compareTable.f1"), free: true, premium: true, limitsiz: true },
        { name: t("compareTable.f2"), free: t("compareTable.f2_val1"), premium: t("compareTable.f2_val2"), limitsiz: t("compareTable.f2_val2") },
        { name: t("compareTable.f3"), free: false, premium: true, limitsiz: true },
        { name: t("compareTable.f4"), free: false, premium: true, limitsiz: true },
        { name: t("compareTable.f5"), free: false, premium: t("compareTable.f5_val"), limitsiz: t("compareTable.f5_val") },
        { name: t("compareTable.f6"), free: false, premium: t("compareTable.f6_val"), limitsiz: t("compareTable.f6_val") },
        { name: t("compareTable.f7"), free: "2", premium: "5", limitsiz: "5" },
        { name: t("compareTable.f8"), free: false, premium: true, limitsiz: true },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">{t("compareTable.title")}</h2>

            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#101012]">
                <table className="w-full min-w-[600px] border-collapse">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="p-6 text-left text-zinc-400 font-medium w-1/4">{t("compareTable.features")}</th>
                            <th className="p-6 text-center text-white font-bold text-lg w-1/4">{t("compareTable.free")}</th>
                            <th className="p-6 text-center text-sky-400 font-bold text-lg w-1/4 bg-sky-500/5">{t("compareTable.premium")}</th>
                            <th className="p-6 text-center text-sky-400 font-bold text-lg w-1/4 bg-sky-500/5">{t("compareTable.limitsiz")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {FEATURES.map((feature, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="p-5 pl-6 text-zinc-300 font-medium">{feature.name}</td>

                                {/* Free */}
                                <td className="p-5 text-center text-zinc-500">
                                    {renderCell(feature.free)}
                                </td>

                                {/* Premium */}
                                <td className="p-5 text-center text-sky-100 bg-sky-500/5 font-medium">
                                    {renderCell(feature.premium)}
                                </td>

                                {/* Limitsiz */}
                                <td className="p-5 text-center text-sky-100 bg-sky-500/5 font-medium">
                                    {renderCell(feature.limitsiz)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function renderCell(value: boolean | string) {
    if (value === true) return <Check className="w-5 h-5 mx-auto text-green-500" />;
    if (value === false) return <Minus className="w-5 h-5 mx-auto text-zinc-700" />;
    return <span>{value}</span>;
}
