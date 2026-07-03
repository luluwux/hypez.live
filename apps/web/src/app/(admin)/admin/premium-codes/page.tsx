"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Ticket, Plus, Trash2, Loader2, Copy, Check, Calendar, Server, User } from "lucide-react"

interface UserSummary {
    id: string
    name: string | null
    image: string | null
}

interface ServerSummary {
    id: string
    name: string
    icon: string | null
}

interface PremiumCode {
    id: string
    code: string
    duration: number
    isUsed: boolean
    usedById: string | null
    usedAt: string | null
    usedServerId: string | null
    createdAt: string
    user: UserSummary | null
    server: ServerSummary | null
}

async function adminFetch(method: string, path: string, body?: unknown) {
    const res = await fetch(`/api/admin?path=${encodeURIComponent(path)}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `API Error ${res.status}`)
    }
    const json = await res.json()
    return json.data ?? json
}

export default function PremiumCodesPage() {
    const [codes, setCodes] = useState<PremiumCode[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<PremiumCode | null>(null)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    // Form states
    const [duration, setDuration] = useState<number>(30)
    const [count, setCount] = useState<number>(1)

    const fetchCodes = useCallback(async () => {
        setLoading(true)
        try {
            const data = await adminFetch("GET", "admin/premium-codes")
            setCodes(Array.isArray(data) ? data : [])
        } catch (err: any) {
            toast.error(err.message || "Premium kodları yüklenirken hata oluştu.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCodes()
    }, [fetchCodes])

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (duration <= 0 || count <= 0) return

        setGenerating(true)
        try {
            await adminFetch("POST", "admin/premium-codes", { duration, count })
            toast.success(`${count} adet premium kod başarıyla üretildi.`)
            fetchCodes()
        } catch (err: any) {
            toast.error(err.message || "Kod üretilemedi.")
        } finally {
            setGenerating(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirm) return
        try {
            await adminFetch("DELETE", `admin/premium-codes/${deleteConfirm.id}`)
            toast.success("Premium kod başarıyla silindi.")
            setDeleteConfirm(null)
            fetchCodes()
        } catch (err: any) {
            toast.error(err.message || "Kod silinemedi.")
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedCode(text)
        toast.success("Kod panoya kopyalandı!")
        setTimeout(() => setCopiedCode(null), 2000)
    }

    return (
        <div className="flex-1 space-y-6 p-6 bg-black text-white min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Ticket className="w-8 h-8 text-brand-500 text-purple-500" />
                        Premium Kod Yönetimi
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1 text-zinc-400">
                        Kullanıcıların sunucularını premium yapmak için kullanabilecekleri süreye bağlı premium kodları üret ve listele.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kod Üretme Kartı */}
                <Card className="bg-[#050505] border-white/5 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5 text-purple-500" />
                            Premium Kod Üret
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            İstediğiniz gün süresine sahip kodlar oluşturun.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-zinc-300">Süre (Gün)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min={1}
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                                    className="bg-black border-white/10 text-white focus:border-purple-500"
                                    required
                                />
                                <div className="flex gap-2 mt-2">
                                    {[1, 7, 30, 90, 365].map((d) => (
                                        <Button
                                            key={d}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDuration(d)}
                                            className={`border-white/10 hover:bg-white/5 text-xs ${duration === d ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'text-zinc-400'}`}
                                        >
                                            {d === 365 ? '1 Yıl' : d === 30 ? '1 Ay' : d === 7 ? '1 Hafta' : `${d} Gün`}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="count" className="text-zinc-300">Kod Sayısı</Label>
                                <Input
                                    id="count"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                    className="bg-black border-white/10 text-white focus:border-purple-500"
                                    required
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={generating} 
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Kodlar Üretiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Ticket className="w-4 h-4" />
                                        Kodları Oluştur
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Kodlar Tablosu */}
                <Card className="bg-[#050505] border-white/5 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center justify-between">
                            <span>Mevcut Kodlar</span>
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5">
                                Toplam: {codes.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Sistemde oluşturulan tüm premium kodlar ve kullanım durumları.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                <span>Kod listesi yükleniyor...</span>
                            </div>
                        ) : codes.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 italic">
                                Henüz üretilmiş bir premium kod bulunmuyor.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="border-white/5">
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead className="text-zinc-400">Kod</TableHead>
                                            <TableHead className="text-zinc-400 text-center">Süre</TableHead>
                                            <TableHead className="text-zinc-400">Durum</TableHead>
                                            <TableHead className="text-zinc-400">Oluşturulma</TableHead>
                                            <TableHead className="text-zinc-400 text-right">İşlem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {codes.map((code) => (
                                            <TableRow key={code.id} className="hover:bg-white/[0.01] border-white/5">
                                                <TableCell className="font-mono font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-purple-400 select-all">{code.code}</span>
                                                        <button 
                                                            onClick={() => copyToClipboard(code.code)} 
                                                            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                                                        >
                                                            {copiedCode === code.code ? (
                                                                <Check className="w-3.5 h-3.5 text-green-500" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {code.duration} Gün
                                                </TableCell>
                                                <TableCell>
                                                    {code.isUsed ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-red-400">
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                                                                Kullanıldı
                                                            </div>
                                                            <div className="text-[11px] text-zinc-400 flex flex-col gap-0.5">
                                                                {code.user && (
                                                                    <span className="flex items-center gap-1">
                                                                        <User className="w-3 h-3 text-zinc-500" />
                                                                        {code.user.name}
                                                                    </span>
                                                                )}
                                                                {code.server && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Server className="w-3 h-3 text-zinc-500" />
                                                                        {code.server.name}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] text-zinc-500 font-mono">
                                                                    {new Date(code.usedAt!).toLocaleDateString("tr-TR")}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            Aktif / Kullanılabilir
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-zinc-400">
                                                    <span className="flex items-center gap-1 text-[11px]">
                                                        <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                                                        {new Date(code.createdAt).toLocaleDateString("tr-TR")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteConfirm(code)}
                                                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Silme Onay Modalı */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="bg-[#0a0a0a] border-white/5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg">Kodu İptal Et/Sil</DialogTitle>
                        <DialogDescription className="text-zinc-400 mt-2">
                            Bu premium kodu silmek istediğinize emin misiniz? Eğer silerseniz, bu kod artık kullanılamayacaktır. Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteConfirm && (
                        <div className="py-4 border-t border-b border-white/5 font-mono text-center text-purple-400">
                            {deleteConfirm.code} ({deleteConfirm.duration} Gün)
                        </div>
                    )}
                    <DialogFooter className="gap-2 mt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteConfirm(null)}
                            className="bg-transparent border-white/10 hover:bg-white/5 text-white"
                        >
                            İptal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Kodu Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
