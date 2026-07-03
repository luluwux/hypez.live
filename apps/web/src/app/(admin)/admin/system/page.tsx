"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Settings, Shield, Mail, CreditCard, Bell, Users, Bot, Database, Server, RefreshCw, HardDrive, Check, Loader2, Activity, Cpu
} from "lucide-react"

type TabType = "genel" | "güvenlik" | "e-posta" | "ödeme" | "bildirim" | "kullanıcı" | "bot" | "yedekleme" | "sistem" | "veritabanı";

interface SystemSettingsData {
    siteName: string;
    siteUrl: string;
    siteDescription: string;
    adminEmail: string;
    supportEmail: string;
    defaultLanguage: string;
    timezone: string;
    currency: string;
    maintenanceMode: boolean;
}

export default function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("genel")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    
    const [settings, setSettings] = useState<SystemSettingsData>({
        siteName: "",
        siteUrl: "",
        siteDescription: "",
        adminEmail: "",
        supportEmail: "",
        defaultLanguage: "tr",
        timezone: "Europe/Istanbul",
        currency: "TRY",
        maintenanceMode: false
    })

    const loadSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/admin?path=admin/system/settings")
            if (res.ok) {
                const data = await res.json()
                setSettings(data.data || data)
            }
        } catch (e) {
            console.error("Failed to load system settings", e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const handleSave = async () => {
        setSaving(true)
        setSuccessMessage(null)
        try {
            const res = await fetch("/api/admin?path=admin/system/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                setSuccessMessage("Sistem ayarları başarıyla kaydedildi.")
                setTimeout(() => setSuccessMessage(null), 3000)
            }
        } catch (e) {
            console.error("Failed to save settings", e)
        } finally {
            setSaving(false)
        }
    }

    const TABS: { id: TabType, label: string, icon: React.ReactNode }[] = [
        { id: "genel", label: "Genel", icon: <Settings className="h-4 w-4" /> },
        { id: "güvenlik", label: "Güvenlik", icon: <Shield className="h-4 w-4" /> },
        { id: "e-posta", label: "E-posta", icon: <Mail className="h-4 w-4" /> },
        { id: "ödeme", label: "Ödeme", icon: <CreditCard className="h-4 w-4" /> },
        { id: "bildirim", label: "Bildirim", icon: <Bell className="h-4 w-4" /> },
        { id: "kullanıcı", label: "Kullanıcı", icon: <Users className="h-4 w-4" /> },
        { id: "bot", label: "Bot", icon: <Bot className="h-4 w-4" /> },
        { id: "yedekleme", label: "Yedekleme", icon: <HardDrive className="h-4 w-4" /> },
        { id: "sistem", label: "Sistem", icon: <Server className="h-4 w-4" /> },
        { id: "veritabanı", label: "Veritabanı", icon: <Database className="h-4 w-4" /> },
    ]

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
                        Sistem Ayarları
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Sistem yapılandırması ve yönetim paneli
                    </p>
                </div>
                {successMessage && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
                        <Check className="h-4 w-4" />
                        {successMessage}
                    </div>
                )}
            </div>

            <div className="flex gap-2 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/80 w-full overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            activeTab === tab.id
                                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {activeTab === "genel" && (
                    <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-zinc-800/50 pb-5">
                            <CardTitle className="text-xl">Genel Ayarlar</CardTitle>
                            <CardDescription className="text-zinc-500">Temel site bilgilerini güncelleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Site Adı</Label>
                                            <Input
                                                value={settings.siteName}
                                                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Site URL</Label>
                                            <Input
                                                value={settings.siteUrl}
                                                onChange={(e) => setSettings({...settings, siteUrl: e.target.value})}
                                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-zinc-300">Site Açıklaması</Label>
                                            <Textarea
                                                value={settings.siteDescription}
                                                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100 min-h-[100px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Admin E-posta</Label>
                                            <Input
                                                value={settings.adminEmail}
                                                onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Destek E-posta</Label>
                                            <Input
                                                value={settings.supportEmail}
                                                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Varsayılan Dil</Label>
                                            <Select value={settings.defaultLanguage} onValueChange={(v) => setSettings({...settings, defaultLanguage: v})}>
                                                <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-800">
                                                    <SelectItem value="tr">Türkçe</SelectItem>
                                                    <SelectItem value="en">English</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Saat Dilimi</Label>
                                            <Select value={settings.timezone} onValueChange={(v) => setSettings({...settings, timezone: v})}>
                                                <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-800">
                                                    <SelectItem value="Europe/Istanbul">Europe/Istanbul</SelectItem>
                                                    <SelectItem value="UTC">UTC</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Para Birimi</Label>
                                            <Select value={settings.currency} onValueChange={(v) => setSettings({...settings, currency: v})}>
                                                <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-800">
                                                    <SelectItem value="TRY">TRY (₺)</SelectItem>
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 border-t border-zinc-800 pt-4 md:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-zinc-300 font-semibold text-lg">Bakım Modu</Label>
                                                    <p className="text-sm text-zinc-500">Siteyi geçici olarak bakıma alın (Sadece adminler erişebilir).</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.maintenanceMode} 
                                                    onCheckedChange={(c) => setSettings({...settings, maintenanceMode: c})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-zinc-800/50 pt-5 bg-zinc-900/20">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving || loading}
                                className="bg-primary text-primary-foreground font-bold"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Kaydet
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {activeTab === "sistem" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden">
                            <CardHeader className="border-b border-zinc-800/50 pb-5">
                                <CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-sky-400" /> CPU Kullanımı</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 text-center">
                                <div className="text-4xl font-bold text-zinc-100">12%</div>
                                <div className="text-sm text-zinc-500 mt-2">Intel Xeon E5-2699 v4 @ 2.20GHz</div>
                                <div className="text-xs text-zinc-500">Uptime: 14 Gün, 5 Saat</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden">
                            <CardHeader className="border-b border-zinc-800/50 pb-5">
                                <CardTitle className="flex items-center gap-2"><HardDrive className="w-5 h-5 text-emerald-400" /> RAM Kullanımı</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 text-center">
                                <div className="text-4xl font-bold text-zinc-100">2.4 GB</div>
                                <div className="text-sm text-zinc-500 mt-2">Toplam: 8.0 GB</div>
                                <div className="w-full bg-zinc-800 h-2 mt-4 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full w-[30%]"></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden">
                            <CardHeader className="border-b border-zinc-800/50 pb-5">
                                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-amber-400" /> Network / Cache</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400 text-sm">Redis Hit Oranı:</span>
                                    <span className="text-zinc-100 font-medium">98.5%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400 text-sm">Cache Boyutu:</span>
                                    <span className="text-zinc-100 font-medium">142 MB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400 text-sm">Aktif WebSocket:</span>
                                    <span className="text-zinc-100 font-medium">1,204</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab !== "genel" && activeTab !== "sistem" && (
                    <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <Shield className="w-16 h-16 text-zinc-700 mb-4" />
                            <h3 className="text-xl font-bold text-zinc-300">Bu Bölüm Yakında Eklenecek</h3>
                            <p className="text-zinc-500 mt-2 max-w-md">
                                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} ayarları henüz geliştirilme aşamasındadır. Lütfen daha sonra tekrar kontrol edin.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
