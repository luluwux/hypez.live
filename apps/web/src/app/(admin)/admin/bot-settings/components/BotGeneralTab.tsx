"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Eye, EyeOff, Loader2 } from "lucide-react"

interface BotSettingsData {
    id: string
    botName: string
    prefix: string
    description: string | null
    token: string | null
    autoStart: boolean
    avatar: string | null
    status: string
    commandLogs: boolean
    errorLogs: boolean
    apiLogs: boolean
    systemLogs: boolean
    logLevel: string
    logRetentionDays: number
}

interface BotGeneralTabProps {
    botName: string
    setBotName: (name: string) => void
    prefix: string
    setPrefix: (prefix: string) => void
    description: string
    setDescription: (desc: string) => void
    token: string
    setToken: (token: string) => void
    showToken: boolean
    setShowToken: (show: boolean) => void
    autoStart: boolean
    setAutoStart: (auto: boolean) => void
    savingSettings: boolean
    handleSaveSettings: () => Promise<void>
    WEB_URL: string
    guildId?: string | null
}

export function BotGeneralTab({
    botName,
    setBotName,
    prefix,
    setPrefix,
    description,
    setDescription,
    token,
    setToken,
    showToken,
    setShowToken,
    autoStart,
    setAutoStart,
    savingSettings,
    handleSaveSettings,
    WEB_URL,
    guildId
}: BotGeneralTabProps) {
    return (
        <div className="space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-zinc-800/50 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800/80 rounded-lg text-zinc-400 border border-zinc-700/30">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Bot Bilgileri</CardTitle>
                            <CardDescription className="text-zinc-500">Botunuzun temel bilgilerini düzenleyin.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Avatar & Status */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-800/40">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-800 flex items-center justify-center text-white text-4xl font-extrabold border-2 border-zinc-700 shadow-2xl transition-all duration-300 hover:scale-105">
                                {botName ? botName.charAt(0).toUpperCase() : "B"}
                            </div>
                        </div>
                        <div className="text-center sm:text-left space-y-3 flex-1">
                            <div className="flex flex-col sm:flex-row items-center gap-2.5">
                                <h3 className="text-xl font-bold text-zinc-100">{botName || "İsimsiz Bot"}</h3>
                                <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Çevrimiçi
                                </span>
                            </div>
                            <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all text-xs h-9 rounded-xl px-4">
                                Avatar Değiştir
                            </Button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-sm font-semibold">Bot Adı</Label>
                            <Input
                                value={botName}
                                onChange={(e) => setBotName(e.target.value)}
                                placeholder="Bot Adı"
                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder-zinc-650 focus:border-zinc-700 transition-all rounded-xl h-12 px-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-sm font-semibold">Komut Öneki</Label>
                            <Input
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                                placeholder="!"
                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder-zinc-650 focus:border-zinc-700 transition-all rounded-xl h-12 px-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <Label className="text-zinc-300 text-sm font-semibold">Açıklama</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Botunuz hakkında kısa bir açıklama girin..."
                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder-zinc-650 focus:border-zinc-700 transition-all rounded-xl min-h-[120px] p-4 text-sm"
                            />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <Label className="text-zinc-300 text-sm font-semibold">Bot Token</Label>
                            <div className="relative">
                                <Input
                                    type={showToken ? "text" : "password"}
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Token girin"
                                    className="bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder-zinc-650 focus:border-zinc-700 transition-all rounded-xl h-12 pr-12 pl-4 text-sm font-mono tracking-wider"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <span className="text-[11px] text-zinc-500 mt-1 block">Token güvenli bir şekilde saklanır ve şifrelenir.</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bot Ayarları Kartı (Toggles) */}
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-zinc-800/50 pb-5">
                    <CardTitle className="text-xl">Bot Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between p-1">
                        <div className="space-y-0.5 max-w-[80%]">
                            <Label className="text-zinc-200 font-semibold text-sm">Otomatik Başlatma</Label>
                            <p className="text-xs text-zinc-500">Bot sunucu yeniden başladığında otomatik olarak çalışsın.</p>
                        </div>
                        <Switch
                            checked={autoStart}
                            onCheckedChange={setAutoStart}
                            className="data-[state=checked]:bg-zinc-100 data-[state=unchecked]:bg-zinc-800"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-[1.02] active:scale-[0.98] font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                    {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    )
}
