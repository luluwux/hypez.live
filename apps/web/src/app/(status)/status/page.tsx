import { Metadata } from 'next'
import { StatusClient } from './client-page'

export const revalidate = 60

export const metadata: Metadata = {
    title: 'System Status | Hypez',
    description: 'Real-time status of all Hypez services. Check if hypez.live, API, and Discord gateway are operational.',
    openGraph: {
        title: 'System Status — Hypez',
        description: 'Real-time status of all Hypez services.',
        url: 'https://hypez.live/status',
    },
}

export type UptimeDay = 'up' | 'down' | 'degraded' | 'empty'
export type MonitorStatus = 'up' | 'down' | 'degraded' | 'unknown'

export interface UptimeDayEntry {
    status: UptimeDay
    date: string
    uptimePercent?: number
    downtimeDuration?: string
}

export interface MonitorData {
    id: string
    name: string
    url: string
    status: MonitorStatus
    availability: number
    responseTime: number
    uptimeDays: UptimeDayEntry[]
}

interface BetterstackAttributes {
    pronounceable_name: string
    url: string
    status: string
    availability: number
    response_time: number
}

interface BetterstackMonitor {
    id: string
    attributes: BetterstackAttributes
}

function generateUptimeDays(): UptimeDayEntry[] {
    const today = new Date()
    return Array.from({ length: 90 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (89 - i))
        return {
            status: 'empty' as const,
            date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        }
    })
}

function mapStatus(s: string): MonitorStatus {
    if (s === 'up') return 'up'
    if (s === 'down') return 'down'
    if (s === 'degraded') return 'degraded'
    return 'unknown'
}

function mapCloudflareIndicator(indicator: string): MonitorStatus {
    if (indicator === 'none') return 'up'
    if (indicator === 'minor') return 'degraded'
    if (indicator === 'major' || indicator === 'critical') return 'down'
    if (indicator === 'maintenance') return 'degraded'
    return 'unknown'
}

async function fetchCloudflareStatus(): Promise<MonitorData> {
    const fallback: MonitorData = {
        id: 'cloudflare',
        name: 'Cloudflare',
        url: 'https://www.cloudflarestatus.com',
        status: 'unknown',
        availability: 100,
        responseTime: 0,
        uptimeDays: generateUptimeDays(),
    }

    try {
        const res = await fetch('https://www.cloudflarestatus.com/api/v2/status.json', {
            next: { revalidate: 60 },
        })
        if (!res.ok) return fallback

        const json = await res.json()
        const indicator: string = json?.status?.indicator ?? 'unknown'
        const status = mapCloudflareIndicator(indicator)

        return {
            id: 'cloudflare',
            name: 'Cloudflare',
            url: 'https://www.cloudflarestatus.com',
            status,
            availability: status === 'up' ? 100 : status === 'degraded' ? 99 : 95,
            responseTime: 0,
            uptimeDays: generateUptimeDays(),
        }
    } catch {
        return fallback
    }
}

function getPlaceholderMonitors(): MonitorData[] {
    return [
        { id: 'web', name: 'hypez.live', url: 'https://hypez.live', status: 'unknown', availability: 100, responseTime: 0, uptimeDays: generateUptimeDays() },
        { id: 'api', name: 'api.hypez.live', url: 'https://api.hypez.live', status: 'unknown', availability: 100, responseTime: 0, uptimeDays: generateUptimeDays() },
        { id: 'db', name: 'Database', url: '', status: 'unknown', availability: 100, responseTime: 0, uptimeDays: generateUptimeDays() },
        { id: 'discord', name: 'Discord API & Gateway', url: '', status: 'unknown', availability: 100, responseTime: 0, uptimeDays: generateUptimeDays() },
    ]
}

async function fetchMonitors(): Promise<MonitorData[]> {
    const apiKey = process.env.BETTERSTACK_API_KEY
    if (!apiKey) return getPlaceholderMonitors()

    try {
        const res = await fetch('https://uptime.betterstack.com/api/v2/monitors', {
            headers: { Authorization: `Bearer ${apiKey}` },
            next: { revalidate: 60 },
        })
        if (!res.ok) return getPlaceholderMonitors()

        const json = await res.json()
        const raw: BetterstackMonitor[] = Array.isArray(json.data) ? json.data : []
        if (raw.length === 0) return getPlaceholderMonitors()

        return raw.map((m) => ({
            id: m.id,
            name: m.attributes.pronounceable_name || m.attributes.url,
            url: m.attributes.url ?? '',
            status: mapStatus(m.attributes.status),
            availability: m.attributes.availability ?? 100,
            responseTime: m.attributes.response_time ?? 0,
            uptimeDays: generateUptimeDays(),
        }))
    } catch {
        return getPlaceholderMonitors()
    }
}

export default async function StatusPage() {
    const [monitors, cloudflare] = await Promise.all([
        fetchMonitors(),
        fetchCloudflareStatus(),
    ])

    const lastUpdated = new Date().toISOString()

    return <StatusClient monitors={[...monitors, cloudflare]} lastUpdated={lastUpdated} />
}
