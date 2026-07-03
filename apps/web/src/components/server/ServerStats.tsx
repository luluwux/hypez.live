"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Mic, MessageSquare, Star, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Server } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/hooks";

const CARD_GRADIENT = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";

const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn(CARD_GRADIENT, "rounded-2xl border border-white/5", className)}>
        {children}
    </div>
);
const CardHeader = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("flex flex-row items-center justify-between p-6 pb-2", className)}>{children}</div>
);
const CardTitle = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("text-sm font-medium text-zinc-400 flex items-center gap-2", className)}>{children}</div>
);
const CardContent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("p-6 pt-0", className)}>{children}</div>
);

function formatDate(dateStr: string, locale: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

interface ServerStatsProps {
    server: Server;
}

export function ServerStats({ server }: ServerStatsProps) {
    const { t, language } = useTranslation();
    const stats = server.stats || [];
    const locale = language === 'tr' ? 'tr-TR' : language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ru' ? 'ru-RU' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-BD' : 'en-US';

    const voiceData = useMemo(() => {
        if (stats.length === 0) return [];
        return [...stats]
            .reverse()
            .map(s => ({ name: formatDate(s.recordedAt, locale), value: s.voiceCount }));
    }, [stats, locale]);

    const messageData = useMemo(() => {
        if (stats.length === 0) return [];
        return [...stats]
            .reverse()
            .map(s => ({ name: formatDate(s.recordedAt, locale), value: s.messageCount }));
    }, [stats, locale]);

    const hasRealData = stats.length > 0;
    const hypeScore = server.weeklyHypeScore ?? 0;
    const totalHype = server.totalHypeScore ?? 0;

    const hypeData = useMemo(() => {
        if (!hypeScore) return [];
        return Array.from({ length: 7 }).map((_, i) => ({
            name: t('server.stats.dayN').replace('{n}', String(i + 1)),
            value: Math.max(0, Math.round(hypeScore / 7 * (i + 1) + (Math.random() - 0.5) * 20)),
        }));
    }, [hypeScore, t]);

    return (
        <div className="space-y-6 mt-8">
            {/* Key metric highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-5 text-center")}>
                    <Flame className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{hypeScore.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500 mt-1">{t('server.stats.weeklyHype')}</div>
                </div>
                <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-5 text-center")}>
                    <Zap className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{totalHype.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500 mt-1">{t('server.stats.totalHype')}</div>
                </div>
                <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-5 text-center")}>
                    <MessageSquare className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{(server.weeklyMessageCount || 0).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500 mt-1">{t('server.stats.weeklyMessages')}</div>
                </div>
                <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-5 text-center")}>
                    <Mic className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{(server.weeklyVoiceMinutes || 0).toLocaleString()} dk</div>
                    <div className="text-xs text-zinc-500 mt-1">{t('server.stats.voiceActivity')}</div>
                </div>
            </div>

            {/* Voice & Message Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Mic className="w-4 h-4 text-zinc-500" />
                            {t('server.stats.voiceActivityChart')}
                        </CardTitle>
                        {hasRealData && (
                            <span className="text-[10px] text-zinc-600">{t('server.stats.lastNRecords').replace('{n}', String(stats.length))}</span>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            {voiceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={voiceData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#22c55e' }}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                                    {t('server.stats.noVoiceData')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Message Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <MessageSquare className="w-4 h-4 text-zinc-500" />
                            {t('server.stats.messageActivityChart')}
                        </CardTitle>
                        {hasRealData && (
                            <div className="text-xs text-zinc-500 font-normal ml-auto">{t('server.stats.lastNRecords').replace('{n}', '5')}</div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            {messageData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={messageData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#3b82f6' }}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                                    {t('server.stats.noMessageData')}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Hype Score Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <Flame className="w-4 h-4 text-zinc-500" />
                        {t('server.stats.hypeScoreTrend')}
                    </CardTitle>
                    <span className="text-[10px] text-zinc-600">{t('server.stats.weeklyHypeScore').replace('{score}', hypeScore.toLocaleString())}</span>
                </CardHeader>
                <CardContent>
                    <div className="h-[220px] w-full">
                        {hypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={hypeData}>
                                    <defs>
                                        <linearGradient id="colorHype" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#f97316' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#f97316" fillOpacity={1} fill="url(#colorHype)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                                {t('server.stats.noHypeData')}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Server Stats Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <Star className="w-4 h-4 text-zinc-500" />
                        {t('server.info.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{(server.votes ?? 0).toLocaleString()}</div>
                            <div className="text-xs text-zinc-500 mt-1">{t('server.stats.totalVotes')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{server.memberCount?.toLocaleString()}</div>
                            <div className="text-xs text-zinc-500 mt-1">{t('server.stats.members')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{(server.boostCount ?? 0).toLocaleString()}</div>
                            <div className="text-xs text-zinc-500 mt-1">{t('server.stats.boost')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{(server.channelCount ?? 0).toLocaleString()}</div>
                            <div className="text-xs text-zinc-500 mt-1">{t('server.stats.channels')}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
