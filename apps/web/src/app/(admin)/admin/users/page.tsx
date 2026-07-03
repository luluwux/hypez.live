"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import {
    MoreHorizontal, RefreshCw, Search, Settings2, Trash2, Shield,
    AlertTriangle, ChevronDown, Award, ChevronLeft, ChevronRight,
    Crown, BadgeCheck, Clock, Users,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
interface AdminUser {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
    trustScore: number
    premiumLevel: number
    badges: string[]
    isPublished: boolean
    profileViews: number
    hypePoints: number
    emailVerified: string | null
    createdAt: string
}

interface BadgeItem {
    id: string
    name: string
    icon?: string | null
    color: string
    description?: string | null
    targetType: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}
const SYSTEM_USER_BADGE_SLUGS = [
    { name: 'verified',       label: 'Onaylı',          color: '#10b981', icon: '✓' },
    { name: 'early_supporter', label: 'Erken Destekçi',  color: '#8b5cf6', icon: '⏰' },
]
function RoleBadge({ role }: { role: string }) {
    if (role === 'ADMIN') {
        return <Badge className="border bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-bold">Admin</Badge>
    }
    return <Badge className="border bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px] font-bold">User</Badge>
}
export default function UsersPage() {
    const [users, setUsers]         = useState<AdminUser[]>([])
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState<string | null>(null)
    const [search, setSearch]       = useState('')
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 })
    const [availableBadges, setAvailableBadges] = useState<BadgeItem[]>([])
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Sheet state
    const [editTarget,    setEditTarget]    = useState<AdminUser | null>(null)
    const [editName,      setEditName]      = useState('')
    const [editRole,      setEditRole]      = useState('USER')
    const [editTrust,     setEditTrust]     = useState(50)
    const [editPremium,   setEditPremium]   = useState(0)
    const [editPublished, setEditPublished] = useState(false)
    const [editBadges,    setEditBadges]    = useState<string[]>([])
    const [editLoading,   setEditLoading]   = useState(false)

    // Delete
    const [deleteTarget,  setDeleteTarget]  = useState<AdminUser | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchUsers = useCallback(async (page = 1, q = '') => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({ path: 'admin/users', page: String(page), limit: '50' })
            if (q) params.set('q', q)
            const res = await fetch(`/api/admin?${params}`)
            if (!res.ok) throw new Error(`API responded with ${res.status}`)
            const json = await res.json()
            const payload = json.data ?? json
            setUsers(payload.users ?? [])
            setPagination(payload.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 1 })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchAvailableBadges = useCallback(async () => {
        try {
            const res = await fetch('/api/admin?path=admin/badges')
            if (!res.ok) return
            const json = await res.json()
            const list: BadgeItem[] = Array.isArray(json) ? json : (json.data ?? [])
            setAvailableBadges(list.filter(b => b.targetType === 'USER'))
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        fetchUsers()
        fetchAvailableBadges()
    }, [fetchUsers, fetchAvailableBadges])

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            fetchUsers(1, search)
        }, 350)
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
    }, [search, fetchUsers])
    function openEdit(user: AdminUser) {
        setEditTarget(user)
        setEditName(user.name ?? '')
        setEditRole(user.role)
        setEditTrust(user.trustScore)
        setEditPremium(user.premiumLevel)
        setEditPublished(user.isPublished)
        setEditBadges(user.badges ?? [])
    }

    function toggleBadge(slug: string) {
        setEditBadges(prev =>
            prev.includes(slug) ? prev.filter(b => b !== slug) : [...prev, slug]
        )
    }

    async function handleEditSubmit() {
        if (!editTarget) return
        setEditLoading(true)
        try {
            const res = await fetch(`/api/admin?path=admin/users/${editTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name:         editName || undefined,
                    role:         editRole,
                    trustScore:   editTrust,
                    premiumLevel: editPremium,
                    isPublished:  editPublished,
                    badges:       editBadges,
                }),
            })
            if (!res.ok) throw new Error(`Patch failed: ${res.status}`)
            setEditTarget(null)
            fetchUsers(pagination.page, search)
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
            await fetch(`/api/admin?path=admin/users/${deleteTarget.id}`, { method: 'DELETE' })
            setDeleteTarget(null)
            fetchUsers(pagination.page, search)
        } catch (err) {
            console.error(err)
        } finally {
            setDeleteLoading(false)
        }
    }

    // All badge slugs for the dropdown (system + custom DB badges)
    const allUserBadgeSlugs = [
        ...SYSTEM_USER_BADGE_SLUGS,
        ...availableBadges.map(b => ({ name: b.name, label: b.name, color: b.color, icon: b.icon ?? '' })),
    ]
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-sky-400" />
                        User Management
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {pagination.total} kayıtlı kullanıcı
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchUsers(pagination.page, search)} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200 flex-1">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchUsers()} className="shrink-0">Retry</Button>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="İsim, e-posta veya ID..."
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Kullanıcılar</CardTitle>
                    <CardDescription>
                        Sayfa {pagination.page} / {pagination.totalPages} — toplam {pagination.total}
                    </CardDescription>
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
                    ) : users.length === 0 ? (
                        <div className="flex justify-center py-12 text-muted-foreground">Kullanıcı bulunamadı</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kullanıcı</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Trust</TableHead>
                                    <TableHead>Premium</TableHead>
                                    <TableHead>Rozetler</TableHead>
                                    <TableHead>Katılım</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-white/10">
                                                    {user.image
                                                        ? <Image src={user.image} alt={user.name ?? ''} width={36} height={36} className="object-cover" referrerPolicy="no-referrer" />
                                                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                                            {user.name?.charAt(0).toUpperCase() ?? '?'}
                                                          </div>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm leading-none">
                                                        {user.name ?? <span className="text-zinc-500 italic">İsimsiz</span>}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><RoleBadge role={user.role} /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${user.trustScore >= 70 ? 'bg-emerald-500' : user.trustScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${user.trustScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-zinc-400">{user.trustScore}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.premiumLevel > 0
                                                ? <Badge className="border bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">
                                                    <Crown className="w-2.5 h-2.5 mr-1" />Lv.{user.premiumLevel}
                                                  </Badge>
                                                : <span className="text-xs text-zinc-600">—</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.badges.length === 0
                                                    ? <span className="text-xs text-zinc-600">—</span>
                                                    : user.badges.slice(0, 3).map(slug => (
                                                        <span key={slug} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
                                                            {slug}
                                                        </span>
                                                    ))
                                                }
                                                {user.badges.length > 3 && (
                                                    <span className="text-[10px] text-zinc-500">+{user.badges.length - 3}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-400">
                                            {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEdit(user)}>
                                                        <Settings2 className="h-4 w-4 mr-2" />
                                                        Ayarları Yönet
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:text-red-400"
                                                        onClick={() => setDeleteTarget(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Kullanıcıyı Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                            <Button
                                variant="outline" size="sm"
                                disabled={pagination.page <= 1 || loading}
                                onClick={() => fetchUsers(pagination.page - 1, search)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground px-2">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline" size="sm"
                                disabled={pagination.page >= pagination.totalPages || loading}
                                onClick={() => fetchUsers(pagination.page + 1, search)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── Manage Sheet ────────────────────────────────────────────────── */}
            <Sheet open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
                <SheetContent className="w-[420px] sm:w-[520px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-sky-400" />
                            {editTarget?.name ?? 'Kullanıcı Ayarları'}
                        </SheetTitle>
                        <SheetDescription>
                            {editTarget?.email} · ID: {editTarget?.id?.slice(0, 12)}…
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5 py-6">

                        {/* Name */}
                        <div className="space-y-2 p-4 border rounded-xl bg-muted/40">
                            <Label>Görünen Ad</Label>
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="Kullanıcı adı..."
                            />
                        </div>

                        {/* Role + Published */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-3 p-4 border rounded-xl bg-muted/40">
                                <Label className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Rol
                                </Label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-3 p-4 border rounded-xl bg-muted/40">
                                <Label className="flex items-center gap-2">
                                    <BadgeCheck className="h-4 w-4" /> Profil Yayında
                                </Label>
                                <Switch checked={editPublished} onCheckedChange={setEditPublished} />
                                <p className="text-xs text-muted-foreground">Profil herkese açık.</p>
                            </div>
                        </div>

                        {/* Trust Score */}
                        <div className="space-y-3 p-4 border rounded-xl bg-muted/40">
                            <div className="flex items-center justify-between">
                                <Label>Trust Score</Label>
                                <span className={`text-sm font-bold ${editTrust >= 70 ? 'text-emerald-400' : editTrust >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {editTrust}/100
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0} max={100}
                                value={editTrust}
                                onChange={e => setEditTrust(parseInt(e.target.value))}
                                className="w-full accent-sky-500"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600">
                                <span>0 — Güvensiz</span>
                                <span>50 — Normal</span>
                                <span>100 — Tam Güven</span>
                            </div>
                        </div>

                        {/* Premium Level */}
                        <div className="space-y-2 p-4 border rounded-xl bg-muted/40">
                            <Label className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-sky-400" /> Premium Seviye
                            </Label>
                            <Select value={String(editPremium)} onValueChange={v => setEditPremium(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0 — Ücretsiz</SelectItem>
                                    <SelectItem value="1">1 — Premium</SelectItem>
                                    <SelectItem value="2">2 — Premium+</SelectItem>
                                    <SelectItem value="3">3 — Premium Pro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Badges */}
                        <div className="space-y-3 p-4 border rounded-xl bg-muted/40">
                            <Label className="flex items-center gap-2">
                                <Award className="h-4 w-4" /> Rozetler
                                <span className="text-xs text-zinc-500 font-normal ml-auto">{editBadges.length} aktif</span>
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
                                                editBadges.map(slug => {
                                                    const found = allUserBadgeSlugs.find(b => b.name === slug)
                                                    return (
                                                        <span
                                                            key={slug}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white font-medium"
                                                            style={{ backgroundColor: found?.color ?? '#52525b' }}
                                                        >
                                                            {found?.icon && <span>{found.icon}</span>}
                                                            {found?.label ?? slug}
                                                        </span>
                                                    )
                                                })
                                            )}
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
                                    {SYSTEM_USER_BADGE_SLUGS.length > 0 && (
                                        <>
                                            <DropdownMenuLabel>Sistem Rozetleri</DropdownMenuLabel>
                                            {SYSTEM_USER_BADGE_SLUGS.map(b => (
                                                <DropdownMenuCheckboxItem
                                                    key={b.name}
                                                    checked={editBadges.includes(b.name)}
                                                    onCheckedChange={() => toggleBadge(b.name)}
                                                    onSelect={e => e.preventDefault()}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                                                        {b.icon} {b.label}
                                                    </span>
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </>
                                    )}
                                    {availableBadges.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Özel Rozetler</DropdownMenuLabel>
                                            {availableBadges.map(badge => (
                                                <DropdownMenuCheckboxItem
                                                    key={badge.id}
                                                    checked={editBadges.includes(badge.name)}
                                                    onCheckedChange={() => toggleBadge(badge.name)}
                                                    onSelect={e => e.preventDefault()}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: badge.color }} />
                                                        {badge.icon && <span>{badge.icon}</span>}
                                                        {badge.name}
                                                    </span>
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </>
                                    )}
                                    {availableBadges.length === 0 && (
                                        <div className="px-3 py-4 text-xs text-center text-muted-foreground">
                                            Özel rozet yok. Badges sayfasından oluşturun.
                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {editBadges.includes('early_supporter') && (
                                <p className="text-xs text-purple-400/80 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> early_supporter rozeti kullanıcıya eklendi
                                </p>
                            )}
                        </div>

                        {/* Stats (read-only) */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Profil Görüntülenme', value: editTarget?.profileViews?.toLocaleString() ?? '0' },
                                { label: 'Hype Puanı',          value: editTarget?.hypePoints?.toLocaleString() ?? '0' },
                                { label: 'E-posta Onaylı',      value: editTarget?.emailVerified ? 'Evet' : 'Hayır' },
                            ].map(stat => (
                                <div key={stat.label} className="p-3 border rounded-xl bg-muted/40 text-center">
                                    <p className="text-lg font-bold text-white">{stat.value}</p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <SheetFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>İptal</Button>
                        <Button onClick={handleEditSubmit} disabled={editLoading}>
                            {editLoading ? 'Kaydediliyor...' : 'Güncelle'}
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
                            Kullanıcıyı Sil
                        </DialogTitle>
                        <DialogDescription>
                            <span className="font-semibold text-foreground">{deleteTarget?.name ?? deleteTarget?.email}</span>{' '}
                            kullanıcısını kalıcı olarak silmek istediğine emin misin?
                            Bu işlem geri alınamaz ve kullanıcının tüm verilerini siler.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>İptal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? 'Siliniyor...' : 'Sil'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
