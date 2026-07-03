"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, Shield, Loader2, User, Server, Lock, Crown, Sparkles, Bot, Clock, BadgeCheck, Radio, TrendingUp, Star } from "lucide-react"

interface BadgeItem {
    id: string
    name: string
    icon?: string | null
    color: string
    description?: string | null
    targetType: string
    createdAt: string
}

type TargetFilter = "SERVER" | "USER"

const PRESET_COLORS = [
    "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
]

// These are always shown, managed via premiumTier / isToken fields — not the badges[] array
interface SystemBadgeDef {
    name: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
    targetType: "SERVER" | "USER"
    description: string
    trigger: string
}

const SYSTEM_BADGES: SystemBadgeDef[] = [
    {
        name: "Premium",
        icon: Crown,
        color: "text-sky-300",
        bgColor: "bg-sky-500/15 border-sky-500/30",
        targetType: "SERVER",
        description: "Aktif Premium aboneliğe sahip sunucular için otomatik rozet.",
        trigger: "premiumTier === 'PREMIUM' veya isPremium === true",
    },
    {
        name: "Token",
        icon: Sparkles,
        color: "text-amber-300",
        bgColor: "bg-amber-500/15 border-amber-500/30",
        targetType: "SERVER",
        description: "Token sahibi sunucular için otomatik rozet.",
        trigger: "isToken === true veya premiumTier === 'TOKEN'",
    },
    {
        name: "Yeni Bot",
        icon: Bot,
        color: "text-green-300",
        bgColor: "bg-green-500/15 border-green-500/30",
        targetType: "SERVER",
        description: "Son 24 saatte platforma eklenen sunucu.",
        trigger: "createdAt >= son 24 saat",
    },
    {
        name: "Erken Destekçi",
        icon: Clock,
        color: "text-purple-300",
        bgColor: "bg-purple-500/15 border-purple-500/30",
        targetType: "SERVER",
        description: "İlk destekçilerden — badges dizisinde 'early_supporter' var.",
        trigger: "badges dizisi 'early_supporter' içeriyor",
    },
    {
        name: "Doğrulanmış",
        icon: BadgeCheck,
        color: "text-emerald-300",
        bgColor: "bg-emerald-500/15 border-emerald-500/30",
        targetType: "SERVER",
        description: "Doğrulanmış sunucu — badges dizisinde 'verified' var.",
        trigger: "badges dizisi 'verified' içeriyor",
    },
    {
        name: "Yayıncı",
        icon: Radio,
        color: "text-rose-300",
        bgColor: "bg-rose-500/15 border-rose-500/30",
        targetType: "SERVER",
        description: "Aktif yayıncı sunucusu — badges dizisinde 'streamer' var.",
        trigger: "badges dizisi 'streamer' içeriyor",
    },
    {
        name: "Trend",
        icon: TrendingUp,
        color: "text-orange-300",
        bgColor: "bg-orange-500/15 border-orange-500/30",
        targetType: "SERVER",
        description: "Bu hafta trend olan sunucu.",
        trigger: "weeklyHypeScore >= 100",
    },
    {
        name: "Top Community",
        icon: Star,
        color: "text-yellow-300",
        bgColor: "bg-yellow-500/15 border-yellow-500/30",
        targetType: "SERVER",
        description: "En iyi topluluk sunucusu.",
        trigger: "badges dizisi 'top_community' içeriyor",
    },
    {
        name: "Partner",
        icon: Shield,
        color: "text-blue-300",
        bgColor: "bg-blue-500/15 border-blue-500/30",
        targetType: "SERVER",
        description: "Hypez partner sunucusu.",
        trigger: "badges dizisi 'partner' içeriyor",
    },
    {
        name: "Admin",
        icon: Shield,
        color: "text-red-300",
        bgColor: "bg-red-500/15 border-red-500/30",
        targetType: "USER",
        description: "Platform yöneticisi.",
        trigger: "role === 'ADMIN'",
    },
    {
        name: "Onaylı",
        icon: BadgeCheck,
        color: "text-emerald-300",
        bgColor: "bg-emerald-500/15 border-emerald-500/30",
        targetType: "USER",
        description: "Doğrulanmış kullanıcı.",
        trigger: "badges dizisi 'verified' içeriyor",
    },
    {
        name: "Erken Destekçi",
        icon: Clock,
        color: "text-purple-300",
        bgColor: "bg-purple-500/15 border-purple-500/30",
        targetType: "USER",
        description: "Platforma erken katılan destekçi.",
        trigger: "badges dizisi 'early_supporter' içeriyor",
    },
    {
        name: "Premium",
        icon: Crown,
        color: "text-sky-300",
        bgColor: "bg-sky-500/15 border-sky-500/30",
        targetType: "USER",
        description: "Premium kullanıcı.",
        trigger: "premiumLevel > 0",
    },
]

async function adminFetch(method: string, path: string, body?: unknown) {
    const res = await fetch(`/api/admin?path=${encodeURIComponent(path)}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const json = await res.json()
    return json.data ?? json
}

export default function BadgesPage() {
    const [badges, setBadges] = useState<BadgeItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TargetFilter>("SERVER")
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingBadge, setEditingBadge] = useState<BadgeItem | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<BadgeItem | null>(null)
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState("")
    const [icon, setIcon] = useState("")
    const [color, setColor] = useState("#6366f1")
    const [description, setDescription] = useState("")
    const [targetType, setTargetType] = useState<TargetFilter>("SERVER")

    const fetchAllBadges = useCallback(async () => {
        setLoading(true)
        try {
            const data = await adminFetch("GET", "admin/badges")
            setBadges(Array.isArray(data) ? data : [])
        } catch {
            setBadges([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAllBadges() }, [fetchAllBadges])

    const openCreateSheet = (defaultTarget: TargetFilter) => {
        setEditingBadge(null)
        setName("")
        setIcon("")
        setColor("#6366f1")
        setDescription("")
        setTargetType(defaultTarget)
        setSheetOpen(true)
    }

    const openEditSheet = (badge: BadgeItem) => {
        setEditingBadge(badge)
        setName(badge.name)
        setIcon(badge.icon || "")
        setColor(badge.color)
        setDescription(badge.description || "")
        setTargetType(badge.targetType as TargetFilter)
        setSheetOpen(true)
    }

    const handleSaveBadge = async () => {
        if (!name.trim()) return
        setSaving(true)
        try {
            const payload = {
                name: name.trim(),
                icon: icon || undefined,
                color,
                description: description || undefined,
                targetType,
            }
            if (editingBadge) {
                await adminFetch("PATCH", `admin/badges/${editingBadge.id}`, payload)
            } else {
                await adminFetch("POST", "admin/badges", payload)
            }
            setSheetOpen(false)
            fetchAllBadges()
        } catch {
            // errors handled silently; server-side logs capture them
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteBadge = async () => {
        if (!deleteConfirm) return
        try {
            await adminFetch("DELETE", `admin/badges/${deleteConfirm.id}`)
            setDeleteConfirm(null)
            fetchAllBadges()
        } catch {
            // error handled silently
        }
    }

    const filteredBadges = badges.filter(b => b.targetType === activeTab)
    const systemBadgesForTab = SYSTEM_BADGES.filter(b => b.targetType === activeTab)

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Badges</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Sunucu ve kullanıcı rozetlerini yönet.
                    </p>
                </div>
                <Button onClick={() => openCreateSheet(activeTab)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Rozet
                </Button>
            </div>

            {/* Tabs: SERVER / USER */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit border border-border">
                {(["SERVER", "USER"] as TargetFilter[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab
                                ? "bg-background text-foreground shadow"
                                : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {tab === "SERVER"
                            ? <Server className="h-3.5 w-3.5" />
                            : <User className="h-3.5 w-3.5" />
                        }
                        {tab === "SERVER" ? "Sunucu" : "Kullanıcı"}
                        <span className="ml-0.5 text-xs opacity-60">
                            {badges.filter(b => b.targetType === tab).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* System Badges (read-only) */}
            {systemBadgesForTab.length > 0 && (
                <Card className="border-border bg-muted/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Lock className="h-4 w-4 text-zinc-500" />
                            Sistem Rozetleri
                        </CardTitle>
                        <CardDescription>
                            Bu rozetler otomatik atanır, platform tarafından yönetilir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {systemBadgesForTab.map((sb) => {
                                const Icon = sb.icon
                                return (
                                    <div
                                        key={sb.name}
                                        className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                            sb.bgColor,
                                            sb.color
                                        )}
                                        title={`${sb.description} — ${sb.trigger}`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {sb.name}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Custom Badges table */}
            <Card className="border-border bg-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {activeTab === "SERVER" ? "Sunucu Rozetleri" : "Kullanıcı Rozetleri"}
                    </CardTitle>
                    <CardDescription>{filteredBadges.length} özel rozet</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                        </div>
                    ) : filteredBadges.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Henüz özel rozet yok.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCreateSheet(activeTab)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                İlk rozeti oluştur
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rozet</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead>Oluşturulma</TableHead>
                                    <TableHead className="w-20" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBadges.map((badge) => (
                                    <TableRow key={badge.id}>
                                        <TableCell>
                                            <Badge
                                                className="text-white border-0 text-xs font-bold"
                                                style={{ backgroundColor: badge.color }}
                                            >
                                                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                                                {badge.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-zinc-400 max-w-[220px] truncate">
                                            {badge.description || "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-zinc-400">
                                            {new Date(badge.createdAt).toLocaleDateString('tr-TR')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditSheet(badge)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteConfirm(badge)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Sheet — sağdan çıkar */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="bg-background border-border w-[400px] sm:max-w-[400px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingBadge ? "Rozeti Düzenle" : "Yeni Rozet"}</SheetTitle>
                        <SheetDescription>
                            {editingBadge
                                ? "Rozet bilgilerini güncelle."
                                : "Sunucu veya kullanıcı için yeni bir rozet ekle."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Ad</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Rozet adı"
                                className="bg-background border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>İkon (emoji veya URL)</Label>
                            <Input
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="⭐ veya https://..."
                                className="bg-background border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Hedef Tip</Label>
                            <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetFilter)}>
                                <SelectTrigger className="bg-background border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-border bg-background">
                                    <SelectItem value="SERVER">
                                        <span className="flex items-center gap-2">
                                            <Server className="h-3.5 w-3.5" /> Sunucu
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="USER">
                                        <span className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5" /> Kullanıcı
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Rozet açıklaması..."
                                className="bg-background border-border"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Renk</Label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                                            color === c
                                                ? "border-white scale-110"
                                                : "border-transparent hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: c }}
                                        aria-label={c}
                                    />
                                ))}
                            </div>
                            <Input
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="bg-background border-border font-mono text-sm mt-2"
                                placeholder="#6366f1"
                            />
                        </div>

                        <div className="pt-2">
                            <Label className="text-xs text-zinc-500 mb-2 block">Önizleme</Label>
                            <Badge
                                className="text-white border-0 text-sm px-3 py-1"
                                style={{ backgroundColor: color }}
                            >
                                {icon && <span className="mr-1">{icon}</span>}
                                {name || "Rozet"}
                            </Badge>
                        </div>
                    </div>

                    <SheetFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSheetOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveBadge} disabled={saving || !name.trim()}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingBadge ? "Kaydet" : "Oluştur"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Silme onayı */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle>Rozeti Sil</DialogTitle>
                        <DialogDescription>
                            &quot;{deleteConfirm?.name}&quot; rozetini silmek istediğine emin misin?
                            Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            İptal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteBadge}>
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
