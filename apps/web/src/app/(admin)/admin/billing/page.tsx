import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Download, ExternalLink, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminBillingPage() {
    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Faturalar ve Ödemeler</h2>
                    <p className="text-muted-foreground text-sm mt-1">Platform üzerindeki tüm ödeme işlemlerini görüntüleyin.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filtrele
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Dışa Aktar
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Aylık Gelir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺12,450.00</div>
                        <p className="text-xs text-emerald-400 mt-1">+15% geçen aya göre</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Aktif Abonelikler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">142</div>
                        <p className="text-xs text-emerald-400 mt-1">+12 yeni abone</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Başarısız İşlemler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-red-400 mt-1">Son 7 gün içinde</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader>
                    <CardTitle>Son İşlemler</CardTitle>
                    <CardDescription>Platformda gerçekleşen son ödemeler.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-900 rounded-lg">
                                        <CreditCard className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Premium Üyelik (Yıllık)</p>
                                        <p className="text-xs text-zinc-500">Kullanıcı: Ali Yılmaz • INV-{2000 + i}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold">₺599.00</p>
                                        <p className="text-xs text-emerald-400">Başarılı</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
