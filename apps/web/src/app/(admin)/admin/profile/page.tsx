import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Shield, Key } from "lucide-react"

export default function AdminProfilePage() {
    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Admin Profili</h2>
                    <p className="text-muted-foreground text-sm mt-1">Kendi profilinizi ve güvenlik ayarlarınızı yönetin.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-zinc-900/40 border-zinc-800">
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-950 shadow-xl mb-4 flex items-center justify-center text-zinc-500">
                                <User className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold">Admin Kullanıcısı</h3>
                            <p className="text-sm text-zinc-500 mb-4">Süper Yönetici</p>
                            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                                <Shield className="h-3 w-3" />
                                Tam Yetki
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-zinc-900/40 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Kişisel Bilgiler</CardTitle>
                            <CardDescription>Temel profil bilgilerinizi güncelleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>İsim</Label>
                                    <Input defaultValue="Admin Kullanıcısı" className="bg-zinc-950" />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-posta</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input defaultValue="admin@hypez.live" className="pl-10 bg-zinc-950" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button className="bg-white text-zinc-950 hover:bg-zinc-200">Değişiklikleri Kaydet</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Güvenlik</CardTitle>
                            <CardDescription>Şifrenizi ve güvenlik ayarlarınızı değiştirin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Mevcut Şifre</Label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input type="password" placeholder="••••••••" className="pl-10 bg-zinc-950" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Yeni Şifre</Label>
                                        <Input type="password" placeholder="••••••••" className="bg-zinc-950" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Yeni Şifre (Tekrar)</Label>
                                        <Input type="password" placeholder="••••••••" className="bg-zinc-950" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button variant="outline">Şifreyi Güncelle</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
