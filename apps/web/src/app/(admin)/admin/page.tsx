"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowUpIcon, TrendingUp, Server, Users, Vote, Crown, RefreshCw, Clock, Activity as ActivityIcon, AlertTriangle
} from "lucide-react"
import { OverviewChart } from "@/components/admin/overview-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts"
import { useTranslation } from "@/lib/i18n/hooks"

interface DashboardData {
    serverGrowth: { name: string; count: number }[];
    recentLogs: { id: string; adminId: string; action: string; entityId: string; details: string; createdAt: string }[];
    stats: {
        servers: {
            total: number
            visible: number
            hidden: number
            premium: number
            token: number
            newThisWeek: number
        }
        users: { total: number }
        votes: { total: number; last24h: number }
        timestamp: string
    }
}

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    change?: string
    trend?: 'up' | 'down' | 'neutral'
    description?: string
    accent?: string
}

function StatCard({ title, value, icon, change, trend, description, accent = 'text-blue-400' }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden bg-muted/40 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-sm font-medium">{title}</CardDescription>
                <div className={`${accent}`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                {change && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        {trend === 'up' && <ArrowUpIcon className="h-3 w-3 text-emerald-500" />}
                        <span className={trend === 'up' ? 'text-emerald-500' : ''}>{change}</span>
                        {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                    </div>
                )}
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    )
}

function formatAction(action: string) {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171'];

export default function AdminDashboard() {
    const { t } = useTranslation()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    const [period, setPeriod] = useState<string>("weekly")

    async function fetchDashboard(currentPeriod = period) {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin?path=admin/dashboard/stats&period=${currentPeriod}`)
            if (!res.ok) {
                const text = await res.text().catch(() => '')
                throw new Error(`API responded with ${res.status}${text ? ': ' + text : ''}`)
            }
            const json = await res.json()
            const payload = json.data ?? json
            if (payload?.stats) {
                setData(payload)
                setLastRefresh(new Date())
            } else {
                setError('Unexpected response format from API')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
            setError(message)
            console.error('[Dashboard] Fetch failed:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { 
        fetchDashboard(period) 
    }, [period])

    const health = data?.stats
    
    const distributionData = health ? [
        { name: t('admin.standardServers') || 'Standart Sunucular', value: health.servers.total - health.servers.premium - health.servers.token },
        { name: t('admin.premiumServers') || 'Premium Sunucular', value: health.servers.premium },
        { name: t('admin.tokenServers') || 'Token Sunucular', value: health.servers.token }
    ] : [];

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('admin.dashboard')}</h2>
                    <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {loading && !data ? t('admin.loading') : lastRefresh ? `${t('admin.lastUpdated')} ${lastRefresh.toLocaleTimeString()}` : t('admin.noData')}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchDashboard()} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {t('admin.refresh')}
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200 flex-1">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchDashboard()} className="shrink-0">
                        Tekrar Dene
                    </Button>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title={t('admin.totalServers')}
                    value={health?.servers?.total ?? '—'}
                    icon={<Server className="h-5 w-5" />}
                    change={health ? `+${health.servers.newThisWeek} bu hafta` : undefined}
                    trend="up"
                    description="Sisteme kayıtlı tüm sunucular"
                    accent="text-blue-400"
                />
                <StatCard
                    title={t('admin.totalUsers')}
                    value={health?.users?.total ?? '—'}
                    icon={<Users className="h-5 w-5" />}
                    description="Kayıtlı Discord kullanıcıları"
                    accent="text-violet-400"
                />
                <StatCard
                    title="Toplam Oy"
                    value={health?.votes?.total ?? '—'}
                    icon={<Vote className="h-5 w-5" />}
                    change={health ? `Son 24 saatte ${health.votes.last24h} oy` : undefined}
                    trend="up"
                    description="Tüm zamanların oy sayısı"
                    accent="text-emerald-400"
                />
                <StatCard
                    title={t('admin.premiumServers')}
                    value={health?.servers?.premium ?? '—'}
                    icon={<Crown className="h-5 w-5" />}
                    description="Aktif premium abonelikler"
                    accent="text-amber-400"
                />
            </div>

            {/* Chart + Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-border bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>{t('admin.serverGrowth')}</CardTitle>
                            <CardDescription>Sisteme eklenen sunucuların grafiği</CardDescription>
                        </div>
                        <Select value={period} onValueChange={(val) => setPeriod(val)}>
                            <SelectTrigger className="w-[140px] bg-background">
                                <SelectValue placeholder="Zaman Aralığı" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">Haftalık</SelectItem>
                                <SelectItem value="monthly">Aylık</SelectItem>
                                <SelectItem value="yearly">Yıllık</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="pl-2 pt-4">
                        {loading && !data ? (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">Grafik yükleniyor...</div>
                        ) : (
                            <OverviewChart data={data?.serverGrowth} />
                        )}
                    </CardContent>
                </Card>

                {/* Distribution Chart */}
                <Card className="col-span-3 border-border bg-muted/30">
                    <CardHeader>
                        <CardTitle>{t('admin.serverDistribution')}</CardTitle>
                        <CardDescription>Sistemdeki sunucuların üyelik tipleri</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-[350px]">
                         {loading && !data ? (
                            <div className="text-muted-foreground">Yükleniyor...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-7 border-border bg-muted/30 overflow-hidden flex flex-col mt-2">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle className="flex items-center gap-2">
                            <ActivityIcon className="h-4 w-4 text-sky-400" />
                            {t('admin.recentActivity')}
                        </CardTitle>
                        <CardDescription>{t('admin.adminActions')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0 max-h-[300px]">
                        {loading && !data ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">Loglar yükleniyor...</div>
                        ) : data?.recentLogs?.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">Henüz bir eylem bulunmuyor.</div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {data?.recentLogs.map((log) => (
                                    <div key={log.id} className="p-4 flex flex-col gap-1 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-zinc-200">
                                                {formatAction(log.action)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(log.createdAt).toLocaleString('tr-TR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {log.entityId && (
                                            <p className="text-xs text-zinc-500 font-mono">
                                                Hedef ID: {log.entityId}
                                            </p>
                                        )}
                                        {log.details && (
                                            <p className="text-xs text-zinc-400 mt-1">
                                                Detay: {log.details}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
