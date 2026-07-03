"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    MoreHorizontal, Crown, RefreshCw, Search, Settings2, Trash2, Tag,
    Eye, AlertTriangle, Award, ChevronDown,
} from "lucide-react"
import { CategoryIcon } from "@/components/ui/category-icon"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { PremiumTier, Server, FALLBACK_CATEGORIES } from "@hypez/shared-types"
import type { Category } from "@hypez/shared-types"
interface AdminServer extends Omit<Server, 'premiumTier'> {
    premiumTier: PremiumTier
    premiumExpiresAt?: string | null
    isVisible: boolean
    isToken: boolean
    categories: string[]
    badges: string[]
    isBlacklisted: boolean
    blacklistReason: string | null
    createdAt: string
    ownerId: string
}

interface BadgeItem {
    id: string
    name: string
    icon?: string | null
    color: string
    description?: string | null
    targetType: string
}
const QUICK_DURATIONS = [
    { label: '1 Gün',   days: 1 },
    { label: '1 Hafta', days: 7 },
    { label: '1 Ay',    days: 30 },
]

const SELECT_DURATIONS = [
    { label: '2 Ay',    days: 60 },
    { label: '3 Ay',    days: 90 },
    { label: '6 Ay',    days: 180 },
    { label: '1 Yıl',   days: 365 },
    { label: 'Kalıcı',  days: 0 },
]

function addDays(days: number): string | null {
    if (days === 0) return null
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString()
}
function TierBadge({ tier }: { tier: PremiumTier }) {
    const map: Record<PremiumTier, { label: string; className: string }> = {
        [PremiumTier.NONE]:    { label: 'Free',    className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
        [PremiumTier.PREMIUM]: { label: 'Premium', className: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
        [PremiumTier.TOKEN]:   { label: 'Token',   className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    }
    const { label, className } = map[tier] ?? map[PremiumTier.NONE]
    return <Badge className={`border text-[10px] font-bold ${className}`}>{label}</Badge>
}
export default function ServersPage() {
    const [servers, setServers]             = useState<AdminServer[]>([])
    const [filtered, setFiltered]           = useState<AdminServer[]>([])
    const [loading, setLoading]             = useState(true)
    const [error, setError]                 = useState<string | null>(null)
    const [search, setSearch]               = useState('')
    const [tierFilter, setTierFilter]       = useState<'all' | 'premium'>('all')
    const [availableCategories, setAvailableCategories] = useState<Category[]>(FALLBACK_CATEGORIES)
    const [availableBadges, setAvailableBadges]         = useState<BadgeItem[]>([])

    // Sheet state
    const [editTarget,   setEditTarget]   = useState<AdminServer | null>(null)
    const [editDesc,     setEditDesc]     = useState('')
    const [editTier,     setEditTier]     = useState<PremiumTier>(PremiumTier.NONE)
    const [editToken,    setEditToken]    = useState(false)
    const [editVisible,  setEditVisible]  = useState(true)
    const [editCategories, setEditCategories] = useState<string[]>([])
    const [editBadges,   setEditBadges]   = useState<string[]>([])
    const [editBlacklisted, setEditBlacklisted] = useState(false)
    const [editBlacklistReason, setEditBlacklistReason] = useState('')
    const [editLoading,  setEditLoading]  = useState(false)

    // Duration state
    const [editDurationDays,   setEditDurationDays]   = useState(30)
    const [editDurationCustom, setEditDurationCustom] = useState('')

    // Delete confirm
    const [deleteTarget,  setDeleteTarget]  = useState<AdminServer | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchServers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin?path=admin/servers&limit=100')
            if (!res.ok) throw new Error(`API responded with ${res.status}`)
            const json = await res.json()
            const payload = json.data ?? json
            const list: AdminServer[] = payload.servers ?? []
            setServers(list)
            setFiltered(list)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch servers')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchAvailableCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/categories')
            if (!res.ok) return
            const data = await res.json()
            const list = Array.isArray(data) ? data : (data?.data ?? [])
            if (list.length > 0) setAvailableCategories(list)
        } catch { /* fallback already set */ }
    }, [])

    const fetchAvailableBadges = useCallback(async () => {
        try {
            const res = await fetch('/api/admin?path=admin/badges')
            if (!res.ok) return
            const json = await res.json()
            const list: BadgeItem[] = Array.isArray(json) ? json : (json.data ?? [])
            setAvailableBadges(list.filter(b => b.targetType === 'SERVER'))
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        fetchServers()
        fetchAvailableCategories()
        fetchAvailableBadges()
    }, [fetchServers, fetchAvailableCategories, fetchAvailableBadges])

    useEffect(() => {
        let list = servers
        if (tierFilter === 'premium') {
            list = list.filter(s => s.premiumTier === PremiumTier.PREMIUM)
        }
        const q = search.toLowerCase()
        if (q) {
            list = list.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q))
        }
        setFiltered(list)
    }, [search, servers, tierFilter])
    async function patchServer(id: string, body: Record<string, unknown>) {
        const res = await fetch(`/api/admin?path=admin/servers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`Patch failed: ${res.status}`)
        await fetchServers()
    }
    function openEdit(server: AdminServer) {
        setEditTarget(server)
        setEditDesc(server.description ?? '')
        setEditTier(server.premiumTier)
        setEditToken(server.isToken)
        setEditVisible(server.isVisible)
        setEditBlacklisted(server.isBlacklisted ?? false)
        setEditBlacklistReason(server.blacklistReason ?? '')
        setEditCategories(server.categories ?? [])
        setEditBadges(server.badges ?? [])
        setEditDurationDays(30)
        setEditDurationCustom('')
    }

    function toggleCategorySelection(slug: string) {
        setEditCategories(prev => {
            if (prev.includes(slug)) return prev.filter(c => c !== slug)
            if (prev.length >= 3) return prev
            return [...prev, slug]
        })
    }

    function toggleBadgeSelection(name: string) {
        setEditBadges(prev =>
            prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]
        )
    }

    function computePremiumExpiresAt(): string | null {
        const customDays = parseInt(editDurationCustom)
        if (editDurationCustom && !isNaN(customDays) && customDays > 0) {
            return addDays(customDays)
        }
        return addDays(editDurationDays)
    }

    async function handleEditSubmit() {
        if (!editTarget) return
        setEditLoading(true)
        try {
            const updates: Record<string, unknown> = {
                description:  editDesc,
                premiumTier:  editTier,
                isToken:      editToken,
                isVisible:    editVisible,
                isBlacklisted: editBlacklisted,
                blacklistReason: editBlacklisted ? editBlacklistReason : null,
                categories:   editCategories,
                badges:       editBadges,
            }

            if (editTier === PremiumTier.PREMIUM) {
                updates.premiumExpiresAt = computePremiumExpiresAt()
            } else {
                updates.premiumExpiresAt = null
            }

            await patchServer(editTarget.id, updates)
            setEditTarget(null)
        } catch (err) {
            console.error(err)
        } finally {
            setEditLoading(false)
        }
    }
    async function handleDelete() {
        if (!deleteTarget) return
        setDeleteLoading(true)
        try {
            await fetch(`/api/admin?path=admin/servers/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            fetchServers()
        } catch (err) {
            console.error(err)
        } finally {
            setDeleteLoading(false)
        }
    }
    function isDurationSelected(days: number) {
        return editDurationCustom === '' && editDurationDays === days
    }
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Server Management</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {servers.length} servers registered · {servers.filter(s => s.isPremium).length} premium
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchServers} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200 flex-1">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchServers} className="shrink-0">Retry</Button>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 max-w-2xl">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or ID..."
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={tierFilter} onValueChange={v => setTierFilter(v as 'all' | 'premium')}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by Tier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Servers</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200 flex-1">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchServers()} className="shrink-0">Retry</Button>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Directory</CardTitle>
                    <CardDescription>Manage your platform's communities</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex justify-center py-12 text-muted-foreground">No servers found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Server</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Votes</TableHead>
                                    <TableHead>Tier</TableHead>
                                    <TableHead>Visible</TableHead>
                                    <TableHead className="text-right">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(server => (
                                    <TableRow key={server.id} className={!server.isVisible ? 'opacity-50' : ''}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                                                    {server.icon
                                                        ? <Image src={server.icon} alt={server.name} width={36} height={36} className="object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">{server.name.charAt(0)}</div>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm leading-none flex items-center gap-2">
                                                        {server.name}
                                                        {server.isToken && <span className="w-2 h-2 rounded-full bg-purple-500" title="Token Verified" />}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{server.id.slice(0, 8)}…</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{server.memberCount.toLocaleString()}</TableCell>
                                        <TableCell className="text-sm">{server.votes}</TableCell>
                                        <TableCell><TierBadge tier={server.premiumTier} /></TableCell>
                                        <TableCell>
                                            <Badge variant={server.isVisible ? "default" : "secondary"}>
                                                {server.isVisible ? 'Yes' : 'Hidden'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEdit(server)}>
                                                        <Settings2 className="h-4 w-4 mr-2" />
                                                        Manage Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:text-red-400"
                                                        onClick={() => setDeleteTarget(server)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete Server
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ─── Manage Sheet ────────────────────────────────────────────────────── */}
            <Sheet open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
                <SheetContent className="w-[420px] sm:w-[560px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-sky-400" />
                            Manage {editTarget?.name}
                        </SheetTitle>
                        <SheetDescription>Update server details, tiers, and visibility.</SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">

                        {/* Status Toggles */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-3 p-4 border rounded-xl bg-muted/40">
                                <Label className="flex items-center gap-2"><Eye className="h-4 w-4"/> Listing Visibility</Label>
                                <Switch checked={editVisible} onCheckedChange={setEditVisible} />
                                <p className="text-xs text-muted-foreground">Hide from public listing.</p>
                            </div>
                            <div className="flex flex-col gap-3 p-4 border rounded-xl bg-muted/40">
                                <Label className="flex items-center gap-2"><Crown className="h-4 w-4"/> Token Badge</Label>
                                <Switch checked={editToken} onCheckedChange={setEditToken} />
                                <p className="text-xs text-muted-foreground">Display token verified badge.</p>
                            </div>
                            <div className="flex flex-col gap-3 p-4 border rounded-xl bg-muted/40">
                                <Label className="flex items-center gap-2 text-red-400"><AlertTriangle className="h-4 w-4"/> Blacklist</Label>
                                <Switch checked={editBlacklisted} onCheckedChange={setEditBlacklisted} className="data-[state=checked]:bg-red-500" />
                                <p className="text-xs text-muted-foreground">Ban this server from the bot and listings.</p>
                            </div>
                        </div>

                        {editBlacklisted && (
                            <div className="space-y-4 p-4 border border-red-500/20 rounded-xl bg-red-500/5">
                                <div className="space-y-2">
                                    <Label className="text-red-400">Blacklist Reason</Label>
                                    <Input
                                        value={editBlacklistReason}
                                        onChange={e => setEditBlacklistReason(e.target.value)}
                                        placeholder="Reason for blacklisting..."
                                        className="border-red-500/20 focus:border-red-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Premium Tier + Duration */}
                        <div className="space-y-4 p-4 border rounded-xl bg-muted/40">
                            <h4 className="font-medium text-sm">Subscription Tier</h4>
                            <div className="space-y-2">
                                <Label>Tier Level</Label>
                                <Select value={editTier} onValueChange={v => setEditTier(v as PremiumTier)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={PremiumTier.NONE}>Free / Standard</SelectItem>
                                        <SelectItem value={PremiumTier.PREMIUM}>⭐ Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editTier === PremiumTier.PREMIUM && (
                                <div className="space-y-3 pt-1">
                                    <Label>Süre (bugünden itibaren)</Label>

                                    {/* Quick favorites */}
                                    <div className="flex gap-2">
                                        {QUICK_DURATIONS.map(d => (
                                            <button
                                                key={d.days}
                                                type="button"
                                                onClick={() => { setEditDurationDays(d.days); setEditDurationCustom('') }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                                    isDurationSelected(d.days)
                                                        ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                                                        : 'border-border hover:border-zinc-600 text-zinc-400'
                                                }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Select for other durations */}
                                    <Select
                                        value={SELECT_DURATIONS.some(d => isDurationSelected(d.days)) ? String(editDurationDays) : ''}
                                        onValueChange={v => { setEditDurationDays(parseInt(v)); setEditDurationCustom('') }}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Diğer süreler..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SELECT_DURATIONS.map(d => (
                                                <SelectItem key={d.days} value={String(d.days)}>{d.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Custom duration */}
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            placeholder="Özel gün sayısı"
                                            value={editDurationCustom}
                                            onChange={e => {
                                                setEditDurationCustom(e.target.value)
                                                setEditDurationDays(-1)
                                            }}
                                            className={`flex-1 text-sm ${editDurationCustom ? 'border-sky-500 bg-sky-500/5' : ''}`}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">gün</span>
                                    </div>

                                    {editTarget?.premiumExpiresAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Mevcut bitiş: {new Date(editTarget.premiumExpiresAt).toLocaleDateString('tr-TR')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tags (Categories) — multi-select dropdown */}
                        <div className="space-y-3 p-4 border rounded-xl bg-muted/40">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Tags
                                </Label>
                                <span className={`text-xs font-medium ${editCategories.length >= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                    {editCategories.length}/3
                                </span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors min-h-[38px]"
                                    >
                                        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                            {editCategories.length === 0 ? (
                                                <span className="text-muted-foreground">Kategori seç...</span>
                                            ) : (
                                                editCategories.map(slug => {
                                                    const cat = availableCategories.find(c => c.slug === slug)
                                                    return cat ? (
                                                        <span
                                                            key={slug}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                                                            style={{ backgroundColor: cat.color + '22', borderColor: cat.color + '55' }}
                                                        >
                                                            <CategoryIcon name={cat.emoji} className="w-3 h-3" /> {cat.name}
                                                        </span>
                                                    ) : null
                                                })
                                            )}
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
                                    <DropdownMenuLabel>Kategoriler (max 3)</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {availableCategories.map(cat => (
                                        <DropdownMenuCheckboxItem
                                            key={cat.id}
                                            checked={editCategories.includes(cat.slug)}
                                            onCheckedChange={() => toggleCategorySelection(cat.slug)}
                                            onSelect={e => e.preventDefault()}
                                            disabled={!editCategories.includes(cat.slug) && editCategories.length >= 3}
                                        >
                                            <CategoryIcon name={cat.emoji} className="w-4 h-4 mr-1.5 inline-block" /> {cat.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Badges — multi-select dropdown */}
                        <div className="space-y-3 p-4 border rounded-xl bg-muted/40">
                            <Label className="flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Rozetler
                            </Label>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors min-h-[38px]"
                                    >
                                        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                            {editBadges.length === 0 ? (
                                                <span className="text-muted-foreground">Rozet seç...</span>
                                            ) : (
                                                editBadges.map(badgeName => {
                                                    const badge = availableBadges.find(b => b.name === badgeName)
                                                    return badge ? (
                                                        <span
                                                            key={badgeName}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white font-medium"
                                                            style={{ backgroundColor: badge.color }}
                                                        >
                                                            {badge.icon && <span>{badge.icon}</span>}
                                                            {badge.name}
                                                        </span>
                                                    ) : (
                                                        <span key={badgeName} className="px-2 py-0.5 rounded-full text-xs bg-zinc-700">{badgeName}</span>
                                                    )
                                                })
                                            )}
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
                                    <DropdownMenuLabel>Sunucu Rozetleri</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {availableBadges.length === 0 ? (
                                        <div className="px-3 py-4 text-xs text-center text-muted-foreground">
                                            Henüz rozet yok. Badges sayfasından oluşturun.
                                        </div>
                                    ) : (
                                        availableBadges.map(badge => (
                                            <DropdownMenuCheckboxItem
                                                key={badge.id}
                                                checked={editBadges.includes(badge.name)}
                                                onCheckedChange={() => toggleBadgeSelection(badge.name)}
                                                onSelect={e => e.preventDefault()}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: badge.color }}
                                                    />
                                                    {badge.icon && <span>{badge.icon}</span>}
                                                    {badge.name}
                                                </span>
                                            </DropdownMenuCheckboxItem>
                                        ))
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <p className="text-xs text-muted-foreground">
                                Badges sayfasında oluşturulan SERVER rozetleri burada gösterilir.
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-4 p-4 border rounded-xl bg-muted/40">
                            <div className="space-y-2">
                                <Label>About / Description</Label>
                                <Textarea
                                    rows={3}
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    placeholder="Server description..."
                                />
                            </div>
                        </div>
                    </div>

                    <SheetFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                        <Button onClick={handleEditSubmit} disabled={editLoading}>
                            {editLoading ? 'Saving...' : 'Update Server'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* ─── Delete Confirm ──────────────────────────────────────────────── */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Delete Server
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete{' '}
                            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
