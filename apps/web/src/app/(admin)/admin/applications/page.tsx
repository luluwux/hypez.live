"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { MoreHorizontal, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
interface Application {
    id: string
    discordUserId: string
    type: 'STREAMER' | 'VERIFIED' | 'PARTNER'
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    answers: { serverId?: string, reason?: string }
    reviewedBy: string | null
    createdAt: string
    user?: { id: string, name: string | null, image: string | null } | null
    server?: { id: string, name: string, icon: string | null } | null
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}
function TypeBadge({ type }: { type: string }) {
    switch (type) {
        case 'STREAMER': return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Yayıncı</Badge>
        case 'VERIFIED': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Onaylı</Badge>
        case 'PARTNER': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Partner</Badge>
        default: return <Badge variant="outline">{type}</Badge>
    }
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'PENDING': return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20"><Clock className="w-3 h-3 mr-1"/> Bekliyor</Badge>
        case 'APPROVED': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1"/> Onaylandı</Badge>
        case 'REJECTED': return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="w-3 h-3 mr-1"/> Reddedildi</Badge>
        default: return <Badge variant="outline">{status}</Badge>
    }
}
export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 })

    // View Details Sheet
    const [selectedApp, setSelectedApp] = useState<Application | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    const fetchApplications = useCallback(async (page = 1) => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({ path: 'admin/applications', page: String(page), limit: '50' })
            const res = await fetch(`/api/admin?${params}`)
            if (!res.ok) throw new Error(`API responded with ${res.status}`)
            const json = await res.json()
            const payload = json.data ?? json
            setApplications(payload.applications ?? [])
            setPagination(payload.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 1 })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch applications')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    async function handleStatusUpdate(id: string, newStatus: 'APPROVED' | 'REJECTED') {
        setActionLoading(true)
        try {
            // "adminId" represents the admin performing the action
            // Using a static string "ADMIN" since Next.js auth details aren't directly available without context
            const res = await fetch(`/api/admin?path=admin/applications/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, adminId: 'ADMIN_USER' }),
            })
            if (!res.ok) throw new Error(`Status update failed`)
            
            setSelectedApp(null)
            fetchApplications(pagination.page)
        } catch (err) {
            console.error(err)
            alert('Durum güncellenirken bir hata oluştu.')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-sky-400" />
                        Sunucu Başvuruları
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Toplam {pagination.total} başvuru
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchApplications(pagination.page)} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200 flex-1">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchApplications()} className="shrink-0">Tekrar Dene</Button>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Başvurular</CardTitle>
                    <CardDescription>
                        Sayfa {pagination.page} / {pagination.totalPages} — Yayıncı, Onaylı Sunucu ve Partnerlik başvuruları
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
                    ) : applications.length === 0 ? (
                        <div className="flex justify-center py-12 text-muted-foreground">Başvuru bulunamadı</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kullanıcı</TableHead>
                                    <TableHead>Sunucu</TableHead>
                                    <TableHead>Tür</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                    {app.user?.image ? (
                                                        <Image src={app.user.image} alt="Avatar" width={32} height={32} />
                                                    ) : (
                                                        <span className="text-xs">{app.user?.name?.charAt(0) || '?'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{app.user?.name || 'Bilinmiyor'}</p>
                                                    <p className="text-xs text-muted-foreground">Discord ID: {app.discordUserId}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {app.server?.icon && (
                                                    <Image src={`https://cdn.discordapp.com/icons/${app.server.id}/${app.server.icon}.png`} width={24} height={24} className="rounded-full" alt="Icon" />
                                                )}
                                                <span className="text-sm">{app.server?.name || app.answers?.serverId || 'Belirtilmedi'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><TypeBadge type={app.type} /></TableCell>
                                        <TableCell><StatusBadge status={app.status} /></TableCell>
                                        <TableCell className="text-sm text-zinc-400">
                                            {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setSelectedApp(app)}>
                                                        <FileText className="h-4 w-4 mr-2" /> Detayları Gör
                                                    </DropdownMenuItem>
                                                    {app.status === 'PENDING' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-emerald-500 focus:text-emerald-400" onClick={() => handleStatusUpdate(app.id, 'APPROVED')}>
                                                                <CheckCircle className="h-4 w-4 mr-2" /> Kabul Et
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-500 focus:text-red-400" onClick={() => handleStatusUpdate(app.id, 'REJECTED')}>
                                                                <XCircle className="h-4 w-4 mr-2" /> Reddet
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
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

            {/* View Details Sheet */}
            <Sheet open={!!selectedApp} onOpenChange={open => !open && setSelectedApp(null)}>
                <SheetContent className="w-[420px] sm:w-[540px] overflow-y-auto">
                    {selectedApp && (
                        <>
                            <SheetHeader className="mb-6">
                                <SheetTitle className="flex items-center gap-2">
                                    Başvuru Detayları
                                </SheetTitle>
                                <SheetDescription>
                                    ID: {selectedApp.id}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-xl bg-muted/30">
                                        <p className="text-xs text-muted-foreground mb-1">Başvuru Türü</p>
                                        <TypeBadge type={selectedApp.type} />
                                    </div>
                                    <div className="p-4 border rounded-xl bg-muted/30">
                                        <p className="text-xs text-muted-foreground mb-1">Durum</p>
                                        <StatusBadge status={selectedApp.status} />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
                                    <h3 className="font-semibold text-sm border-b pb-2">Kullanıcı Bilgileri</h3>
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                        <span className="text-muted-foreground">İsim:</span>
                                        <span className="font-medium">{selectedApp.user?.name || 'Bilinmiyor'}</span>
                                        <span className="text-muted-foreground">Discord ID:</span>
                                        <span>{selectedApp.discordUserId}</span>
                                        <span className="text-muted-foreground">Tarih:</span>
                                        <span>{new Date(selectedApp.createdAt).toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
                                    <h3 className="font-semibold text-sm border-b pb-2">Sunucu / Açıklama</h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Belirtilen Sunucu ID:</span>
                                            <code className="bg-muted px-2 py-1 rounded text-sky-400">{selectedApp.answers?.serverId || 'Yok'}</code>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Açıklama / Neden:</span>
                                            <div className="bg-zinc-900/50 border p-3 rounded-lg whitespace-pre-wrap">
                                                {selectedApp.answers?.reason || 'Açıklama girilmemiş.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <SheetFooter className="mt-8 flex gap-3">
                                <Button variant="outline" onClick={() => setSelectedApp(null)} disabled={actionLoading}>
                                    Kapat
                                </Button>
                                {selectedApp.status === 'PENDING' && (
                                    <>
                                        <Button 
                                            variant="destructive" 
                                            onClick={() => handleStatusUpdate(selectedApp.id, 'REJECTED')}
                                            disabled={actionLoading}
                                        >
                                            Reddet
                                        </Button>
                                        <Button 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                                            onClick={() => handleStatusUpdate(selectedApp.id, 'APPROVED')}
                                            disabled={actionLoading}
                                        >
                                            Onayla
                                        </Button>
                                    </>
                                )}
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
