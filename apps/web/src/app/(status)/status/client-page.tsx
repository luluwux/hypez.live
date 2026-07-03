"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Globe,
    Server,
    Database,
    Bot,
    Activity,
    Clock,
    Wifi,
    Shield,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/hooks"
import type { MonitorData, MonitorStatus, UptimeDay, UptimeDayEntry } from "./page"

interface StatusClientProps {
    monitors: MonitorData[]
    lastUpdated: string
}

const SERVICE_DESCRIPTIONS: Record<string, string> = {
    'hypez.live': 'Ana web uygulaması',
    'api.hypez.live/health': 'API sağlık kontrolü',
    'api.hypez.live': 'Backend API servisi',
    'database': 'Veritabanı servisi',
    'discord': 'Discord API & Gateway bağlantısı',
    'cloudflare': 'CDN, DDoS koruma ve DNS',
}

function getServiceDescription(name: string, url: string): string {
    const combined = (name + ' ' + url).toLowerCase()
    for (const [key, desc] of Object.entries(SERVICE_DESCRIPTIONS)) {
        if (combined.includes(key.toLowerCase())) return desc
    }
    return ''
}

function getOverallStatus(monitors: MonitorData[]): MonitorStatus {
    if (monitors.every((m) => m.status === 'unknown')) return 'unknown'
    if (monitors.some((m) => m.status === 'down')) return 'down'
    if (monitors.some((m) => m.status === 'degraded')) return 'degraded'
    return 'up'
}

function resolveIcon(name: string, url: string) {
    const combined = (name + url).toLowerCase()
    if (combined.includes('cloudflare')) return Shield
    if (combined.includes('discord')) return Bot
    if (combined.includes('database') || combined.includes('db')) return Database
    if (combined.includes('api.')) return Server
    if (combined.includes('hypez') || combined.includes('web')) return Globe
    return Activity
}

const STATUS_COLORS: Record<MonitorStatus, string> = {
    up: '#10b981',
    degraded: '#f59e0b',
    down: '#ef4444',
    unknown: '#6b7280',
}

const STATUS_BG: Record<MonitorStatus, string> = {
    up: 'bg-emerald-500/10 border-emerald-500/20',
    degraded: 'bg-amber-500/10 border-amber-500/20',
    down: 'bg-red-500/10 border-red-500/20',
    unknown: 'bg-white/5 border-white/10',
}

const STATUS_DOT: Record<MonitorStatus, string> = {
    up: 'bg-[#10b981]',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
    unknown: 'bg-gray-500',
}

const UPTIME_DAY_COLORS: Record<UptimeDay, string> = {
    up: 'bg-[#10b981]',
    down: 'bg-[#ef4444]',
    degraded: 'bg-[#f59e0b]',
    empty: 'bg-[#1f2937]',
}

const UPTIME_STATUS_TEXT: Record<UptimeDay, string> = {
    up: 'Operational',
    down: 'Outage',
    degraded: 'Degraded',
    empty: 'No data',
}

const UPTIME_STATUS_COLOR: Record<UptimeDay, string> = {
    up: 'text-[#10b981]',
    down: 'text-[#ef4444]',
    degraded: 'text-[#f59e0b]',
    empty: 'text-white/30',
}

function UptimeDayBar({ entry, index, total }: { entry: UptimeDayEntry; index: number; total: number }) {
    const [hovered, setHovered] = useState(false)

    const isNearLeft = index < 8
    const isNearRight = index > total - 9
    const tooltipAlign = isNearLeft ? 'left-0' : isNearRight ? 'right-0' : 'left-1/2 -translate-x-1/2'
    const arrowAlign = isNearLeft ? 'left-3' : isNearRight ? 'right-3' : 'left-1/2 -translate-x-1/2'

    return (
        <div
            className="relative flex-1"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                className={`h-7 rounded-[2px] cursor-default transition-opacity duration-150 ${
                    hovered ? 'opacity-60' : 'opacity-100'
                } ${UPTIME_DAY_COLORS[entry.status]}`}
            />
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className={`absolute bottom-full mb-2.5 z-30 pointer-events-none ${tooltipAlign}`}
                    >
                        <div className="bg-[#111213] border border-white/10 text-xs px-3 py-2 rounded-xl whitespace-nowrap shadow-2xl min-w-[120px]">
                            <p className="font-medium text-white/70 mb-1">{entry.date}</p>
                            <p className={`font-semibold ${UPTIME_STATUS_COLOR[entry.status]}`}>
                                {UPTIME_STATUS_TEXT[entry.status]}
                            </p>
                            {entry.uptimePercent !== undefined && (
                                <p className="text-white/35 mt-0.5">{entry.uptimePercent.toFixed(2)}% uptime</p>
                            )}
                            {entry.downtimeDuration && (
                                <p className="text-[#ef4444]/70 mt-0.5">{entry.downtimeDuration} downtime</p>
                            )}
                        </div>
                        <div
                            className={`absolute top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#111213] ${arrowAlign}`}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function UptimeBar({ days }: { days: UptimeDayEntry[] }) {
    return (
        <div className="flex gap-[2px] mt-2.5">
            {days.map((entry, i) => (
                <UptimeDayBar key={i} entry={entry} index={i} total={days.length} />
            ))}
        </div>
    )
}

function ServiceTooltip({ text }: { text: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 bottom-full mb-2 z-10 pointer-events-none"
        >
            <div className="bg-[#111213] border border-white/10 text-white/70 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                {text}
                <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#111213]" />
            </div>
        </motion.div>
    )
}

function OverallStatusHeader({ status, lastUpdated }: { status: MonitorStatus; lastUpdated: string }) {
    const { t } = useTranslation()

    const statusText =
        status === 'up' ? t('status.allOperational') :
        status === 'down' ? t('status.majorOutage') :
        status === 'degraded' ? t('status.someIssues') :
        t('status.allOperational')

    const formatted = new Date(lastUpdated).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center gap-4 pb-10 border-b border-white/5"
        >
            {status === 'up' && (
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                >
                    <CheckCircle2 size={64} strokeWidth={1.5} style={{ color: STATUS_COLORS.up }} />
                </motion.div>
            )}
            {status === 'degraded' && (
                <AlertTriangle size={64} strokeWidth={1.5} style={{ color: STATUS_COLORS.degraded }} />
            )}
            {status === 'down' && (
                <XCircle size={64} strokeWidth={1.5} style={{ color: STATUS_COLORS.down }} />
            )}
            {status === 'unknown' && (
                <Activity size={64} strokeWidth={1.5} className="text-gray-500" />
            )}

            <h1 className="text-3xl font-bold text-white tracking-tight">{statusText}</h1>

            <div className="flex items-center gap-1.5 text-sm text-white/40">
                <Clock size={13} />
                <span>{t('status.lastUpdated')} {formatted}</span>
            </div>
        </motion.div>
    )
}

function MonitorCard({ monitor, index }: { monitor: MonitorData; index: number }) {
    const { t } = useTranslation()
    const [tooltipVisible, setTooltipVisible] = useState(false)
    const Icon = resolveIcon(monitor.name, monitor.url)
    const statusLabel = t(`status.statusLabels.${monitor.status}`)
    const description = getServiceDescription(monitor.name, monitor.url)

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
            className="rounded-2xl bg-[#111213] border border-white/5 p-5 hover:border-white/10 transition-colors overflow-visible"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="relative flex-shrink-0"
                        onMouseEnter={() => description && setTooltipVisible(true)}
                        onMouseLeave={() => setTooltipVisible(false)}
                    >
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center cursor-default">
                            <Icon size={18} className="text-white/60" />
                        </div>
                        <AnimatePresence>
                            {tooltipVisible && description && (
                                <ServiceTooltip text={description} />
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-white text-sm leading-tight truncate">{monitor.name}</p>
                        {monitor.url && (
                            <p className="text-xs text-white/30 mt-0.5 truncate">{monitor.url}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {monitor.status !== 'unknown' && (
                        <>
                            {monitor.responseTime > 0 && (
                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40">
                                    <Wifi size={12} />
                                    <span>{monitor.responseTime}ms</span>
                                </div>
                            )}
                            <span className="hidden sm:block text-xs text-white/40">
                                {monitor.availability.toFixed(2)}% {t('status.uptime')}
                            </span>
                        </>
                    )}
                    <span
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BG[monitor.status]}`}
                        style={{ color: STATUS_COLORS[monitor.status] }}
                    >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[monitor.status]}`} />
                        {statusLabel}
                    </span>
                </div>
            </div>

            {monitor.status !== 'unknown' && (
                <div className="flex sm:hidden items-center gap-3 mt-3 text-xs text-white/40">
                    {monitor.responseTime > 0 && (
                        <span className="flex items-center gap-1"><Wifi size={11} />{monitor.responseTime}ms</span>
                    )}
                    <span>{monitor.availability.toFixed(2)}% {t('status.uptime')}</span>
                </div>
            )}

            <UptimeBar days={monitor.uptimeDays} />

            <div className="flex justify-between mt-1.5 text-[10px] text-white/25 select-none">
                <span>{t('status.daysAgo')}</span>
                <span>{t('status.today')}</span>
            </div>
        </motion.div>
    )
}

export function StatusClient({ monitors, lastUpdated }: StatusClientProps) {
    const { t } = useTranslation()
    const overallStatus = getOverallStatus(monitors)

    return (
        <main className="min-h-screen">
            <div className="max-w-2xl mx-auto px-4 pt-20 pb-16 space-y-10">
                <OverallStatusHeader status={overallStatus} lastUpdated={lastUpdated} />

                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="space-y-3"
                >
                    {monitors.map((monitor, i) => (
                        <MonitorCard key={monitor.id} monitor={monitor} index={i} />
                    ))}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.45 }}
                    className="pt-2"
                >
                    <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">
                        {t('status.incidents')}
                    </h2>
                    <div className="rounded-2xl bg-[#111213] border border-white/5 p-6 flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-[#10b981] flex-shrink-0" />
                        <p className="text-sm text-white/40">{t('status.noIncidents')}</p>
                    </div>
                </motion.section>
            </div>
        </main>
    )
}
