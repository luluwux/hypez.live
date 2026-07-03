"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { Plus, Pencil, Trash2, Tag, Loader2, GripVertical } from "lucide-react"

interface CategoryItem {
    id: string
    name: string
    slug: string
    emoji: string
    color: string
    sortOrder: number
    isActive: boolean
    createdAt: string
}

const PRESET_COLORS = [
    "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
]

const DEFAULT_CATEGORIES = [
    { name: "Gaming", slug: "gaming", emoji: "🎮", color: "#6366f1", sortOrder: 0 },
    { name: "Anime", slug: "anime", emoji: "🎌", color: "#ec4899", sortOrder: 1 },
    { name: "Public", slug: "public", emoji: "🌐", color: "#3b82f6", sortOrder: 2 },
    { name: "Community", slug: "community", emoji: "👥", color: "#10b981", sortOrder: 3 },
    { name: "Music", slug: "music", emoji: "🎵", color: "#f59e0b", sortOrder: 4 },
    { name: "Art", slug: "art", emoji: "🎨", color: "#ec4899", sortOrder: 5 },
    { name: "Design", slug: "design", emoji: "✏️", color: "#8b5cf6", sortOrder: 6 },
    { name: "Programming", slug: "programming", emoji: "💻", color: "#06b6d4", sortOrder: 7 },
    { name: "Science", slug: "science", emoji: "🔬", color: "#14b8a6", sortOrder: 8 },
    { name: "Technology", slug: "technology", emoji: "⚡", color: "#f97316", sortOrder: 9 },
    { name: "Education", slug: "education", emoji: "📚", color: "#3b82f6", sortOrder: 10 },
    { name: "Chill", slug: "chill", emoji: "😌", color: "#10b981", sortOrder: 11 },
    { name: "Roleplay", slug: "roleplay", emoji: "🎭", color: "#8b5cf6", sortOrder: 12 },
    { name: "Crypto", slug: "crypto", emoji: "📈", color: "#f59e0b", sortOrder: 13 },
    { name: "Creators", slug: "creators", emoji: "🎬", color: "#ef4444", sortOrder: 14 },
    { name: "Other", slug: "other", emoji: "💫", color: "#6366f1", sortOrder: 15 },
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

export default function TagsPage() {
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryItem | null>(null)
    const [saving, setSaving] = useState(false)
    const [seeding, setSeeding] = useState(false)

    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")
    const [color, setColor] = useState("#6366f1")
    const [emoji, setEmoji] = useState("📁")
    const [sortOrder, setSortOrder] = useState(0)

    const fetchAllCategories = useCallback(async () => {
        setLoading(true)
        try {
            const data = await adminFetch("GET", "admin/categories")
            setCategories(Array.isArray(data) ? data : [])
        } catch {
            setCategories([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAllCategories() }, [fetchAllCategories])

    const openCreateSheet = () => {
        setEditingCategory(null)
        setName("")
        setSlug("")
        setColor("#6366f1")
        setEmoji("📁")
        setSortOrder(categories.length)
        setSheetOpen(true)
    }

    const openEditSheet = (cat: CategoryItem) => {
        setEditingCategory(cat)
        setName(cat.name)
        setSlug(cat.slug)
        setColor(cat.color)
        setEmoji(cat.emoji)
        setSortOrder(cat.sortOrder)
        setSheetOpen(true)
    }

    const handleSaveCategory = async () => {
        if (!name.trim()) return
        setSaving(true)
        try {
            if (editingCategory) {
                await adminFetch("PATCH", `admin/categories/${editingCategory.id}`, {
                    name: name.trim(),
                    slug: slug.trim() || undefined,
                    color,
                    emoji: emoji || "📁",
                    sortOrder,
                })
            } else {
                await adminFetch("POST", "admin/categories", {
                    name: name.trim(),
                    slug: slug.trim() || undefined,
                    color,
                    emoji: emoji || "📁",
                    sortOrder,
                })
            }
            setSheetOpen(false)
            fetchAllCategories()
        } catch {
            // error handled silently; server-side logs will capture it
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteCategory = async () => {
        if (!deleteConfirm) return
        try {
            await adminFetch("DELETE", `admin/categories/${deleteConfirm.id}`)
            setDeleteConfirm(null)
            fetchAllCategories()
        } catch {
            // error handled silently
        }
    }

    const handleToggleCategoryActive = async (cat: CategoryItem) => {
        try {
            await adminFetch("PATCH", `admin/categories/${cat.id}`, { isActive: !cat.isActive })
            fetchAllCategories()
        } catch {
            // error handled silently
        }
    }

    const handleSeedDefaultCategories = async () => {
        setSeeding(true)
        try {
            for (const cat of DEFAULT_CATEGORIES) {
                await adminFetch("POST", "admin/categories", cat)
            }
            fetchAllCategories()
        } catch {
            // partial seed errors handled silently
        } finally {
            setSeeding(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tags</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Sunucu keşfinde kullanılan kategorileri yönet.
                    </p>
                </div>
                <div className="flex gap-2">
                    {categories.length === 0 && (
                        <Button variant="outline" onClick={handleSeedDefaultCategories} disabled={seeding}>
                            {seeding
                                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                : <Tag className="h-4 w-4 mr-2" />
                            }
                            Varsayılanları Ekle
                        </Button>
                    )}
                    <Button onClick={openCreateSheet}>
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Tag
                    </Button>
                </div>
            </div>

            <Card className="border-border bg-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tüm Taglar
                    </CardTitle>
                    <CardDescription>{categories.length} tag toplam</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            Henüz tag yok. İlk tagi oluştur veya varsayılanları ekle.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10" />
                                    <TableHead>Tag</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="w-24" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat) => (
                                    <TableRow key={cat.id} className={!cat.isActive ? "opacity-50" : ""}>
                                        <TableCell>
                                            <GripVertical className="h-4 w-4 text-zinc-500" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{cat.emoji}</span>
                                                <Badge
                                                    style={{ backgroundColor: cat.color }}
                                                    className="text-white border-0"
                                                >
                                                    {cat.name}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                {cat.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleCategoryActive(cat)}
                                                className={cat.isActive ? "text-green-400 hover:text-green-300" : "text-zinc-500 hover:text-zinc-400"}
                                            >
                                                {cat.isActive ? "Aktif" : "Pasif"}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditSheet(cat)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteConfirm(cat)}
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
                        <SheetTitle>{editingCategory ? "Tagi Düzenle" : "Yeni Tag"}</SheetTitle>
                        <SheetDescription>
                            {editingCategory
                                ? "Tag bilgilerini güncelle."
                                : "Sunucu keşfi için yeni bir tag ekle."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Ad</Label>
                            <Input
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value)
                                    if (!editingCategory) {
                                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                                    }
                                }}
                                placeholder="örn. Gaming"
                                className="bg-background border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                                placeholder="gaming"
                                className="bg-background border-border font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Emoji</Label>
                            <Input
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                placeholder="🎮"
                                className="bg-background border-border text-lg"
                                maxLength={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Sıralama</Label>
                            <Input
                                type="number"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                                className="bg-background border-border"
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
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{emoji}</span>
                                <Badge
                                    style={{ backgroundColor: color }}
                                    className="text-white border-0 text-sm px-3 py-1"
                                >
                                    {name || "Tag"}
                                </Badge>
                                <code className="text-xs text-zinc-500">{slug || "slug"}</code>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSheetOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveCategory} disabled={saving || !name.trim()}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingCategory ? "Kaydet" : "Oluştur"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Silme onayı */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="border-border bg-background">
                    <DialogHeader>
                        <DialogTitle>Tagi Sil</DialogTitle>
                        <DialogDescription>
                            &quot;{deleteConfirm?.name}&quot; tagini silmek istediğine emin misin?
                            Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            İptal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteCategory}>
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
