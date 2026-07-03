"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Activity, RefreshCw, Download, Trash, Loader2 } from "lucide-react"

interface BotLogItem {
    id: string
    timestamp: string
    level: string
    category: string
    message: string
    user: string | null
}

interface BotLogsTabProps {
    logs: BotLogItem[]
    logLevelFilter: string
    setLogLevelFilter: (level: string) => void
    logCategoryFilter: string
    setLogCategoryFilter: (cat: string) => void
    autoRefresh: boolean
    setAutoRefresh: (refresh: boolean) => void
    clearingLogs: boolean
    fetchingLogs: boolean
    handleClearLogs: () => Promise<void>
    handleDownloadLogs: () => void
    loadLogs: (showIndicator: boolean) => Promise<void>
    commandLogs: boolean
    setCommandLogs: (val: boolean) => void
    errorLogs: boolean
    setErrorLogs: (val: boolean) => void
    apiLogs: boolean
    setApiLogs: (val: boolean) => void
    systemLogs: boolean
    setSystemLogs: (val: boolean) => void
    logLevel: string
    setLogLevel: (val: string) => void
    logRetentionDays: number
    setLogRetentionDays: (val: number) => void
    savingSettings: boolean
    handleSaveSettings: (customPayload?: any) => Promise<void>
}

export function BotLogsTab({
    logs,
    logLevelFilter,
    setLogLevelFilter,
    logCategoryFilter,
    setLogCategoryFilter,
    autoRefresh,
    setAutoRefresh,
    clearingLogs,
    fetchingLogs,
    handleClearLogs,
    handleDownloadLogs,
    loadLogs,
    commandLogs,
    setCommandLogs,
    errorLogs,
    setErrorLogs,
    apiLogs,
    setApiLogs,
    systemLogs,
    setSystemLogs,
    logLevel,
    setLogLevel,
    logRetentionDays,
    setLogRetentionDays,
    savingSettings,
    handleSaveSettings
}: BotLogsTabProps) {
    const handleSaveLogSettings = async () => {
        await handleSaveSettings({
            commandLogs,
            errorLogs,
            apiLogs,
            systemLogs,
            logLevel,
            logRetentionDays
        })
    }

    return (
        <div className="space-y-6">
            {/* Log Ayarları */}
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-zinc-800/50 pb-5">
                    <CardTitle className="text-xl">Log Yapılandırması</CardTitle>
                    <CardDescription className="text-zinc-500">Bot loglarının hangi kategorilerde ve seviyelerde tutulacağını ayarlayın.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-zinc-800/30">
                        <div className="flex items-center justify-between p-1">
                            <div className="space-y-0.5">
                                <Label className="text-zinc-200 font-semibold text-xs">Komut Logları</Label>
                                <p className="text-[10px] text-zinc-500">Çalıştırılan tüm bot komutlarını logla.</p>
                            </div>
                            <Switch checked={commandLogs} onCheckedChange={setCommandLogs} className="scale-90" />
                        </div>
                        <div className="flex items-center justify-between p-1">
                            <div className="space-y-0.5">
                                <Label className="text-zinc-200 font-semibold text-xs">Hata Logları</Label>
                                <p className="text-[10px] text-zinc-500">Beklenmeyen hataları ve çökmeleri logla.</p>
                            </div>
                            <Switch checked={errorLogs} onCheckedChange={setErrorLogs} className="scale-90" />
                        </div>
                        <div className="flex items-center justify-between p-1">
                            <div className="space-y-0.5">
                                <Label className="text-zinc-200 font-semibold text-xs">API Logları</Label>
                                <p className="text-[10px] text-zinc-500">API isteklerini ve yanıtlarını logla.</p>
                            </div>
                            <Switch checked={apiLogs} onCheckedChange={setApiLogs} className="scale-90" />
                        </div>
                        <div className="flex items-center justify-between p-1">
                            <div className="space-y-0.5">
                                <Label className="text-zinc-200 font-semibold text-xs">Sistem Logları</Label>
                                <p className="text-[10px] text-zinc-500">Başlatma, durdurma ve servis durumlarını logla.</p>
                            </div>
                            <Switch checked={systemLogs} onCheckedChange={setSystemLogs} className="scale-90" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs font-bold">Minimum Log Seviyesi</Label>
                            <Select value={logLevel} onValueChange={setLogLevel}>
                                <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-100 rounded-xl h-11">
                                    <SelectValue placeholder="Seviye seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                                    <SelectItem value="DEBUG">DEBUG (Tüm detaylar)</SelectItem>
                                    <SelectItem value="INFO">INFO (Bilgilendirmeler ve üstü)</SelectItem>
                                    <SelectItem value="WARN">WARN (Uyarılar ve üstü)</SelectItem>
                                    <SelectItem value="ERROR">ERROR (Sadece hatalar)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs font-bold">Saklama Süresi (Gün)</Label>
                            <Select value={logRetentionDays.toString()} onValueChange={(val) => setLogRetentionDays(parseInt(val))}>
                                <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-zinc-100 rounded-xl h-11">
                                    <SelectValue placeholder="Süre seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                                    <SelectItem value="7">7 Gün</SelectItem>
                                    <SelectItem value="14">14 Gün</SelectItem>
                                    <SelectItem value="30">30 Gün</SelectItem>
                                    <SelectItem value="90">90 Gün</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSaveLogSettings}
                            disabled={savingSettings}
                            className="bg-zinc-100 text-zinc-950 hover:bg-white rounded-xl font-bold flex items-center gap-1.5"
                        >
                            {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                            Log Ayarlarını Kaydet
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Log Akışı */}
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-zinc-800/50 pb-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-800/80 rounded-lg text-zinc-400 border border-zinc-700/30">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Canlı Log Akışı</CardTitle>
                                <CardDescription className="text-zinc-500">Bot tarafından üretilen gerçek zamanlı günlükleri izleyin.</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400">
                                <span>Oto-Yenile (5sn)</span>
                                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="scale-75" />
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadLogs(true)}
                                disabled={fetchingLogs}
                                className="border-zinc-800 text-zinc-400 hover:bg-zinc-800/40 hover:text-white rounded-xl flex items-center gap-1.5"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${fetchingLogs ? "animate-spin" : ""}`} />
                                Yenile
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDownloadLogs}
                                className="border-zinc-800 text-zinc-400 hover:bg-zinc-800/40 hover:text-white rounded-xl flex items-center gap-1.5"
                            >
                                <Download className="h-3.5 w-3.5" />
                                İndir
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleClearLogs}
                                disabled={clearingLogs}
                                className="border-zinc-800 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl flex items-center gap-1.5"
                            >
                                {clearingLogs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                                Temizle
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {/* Log Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-zinc-800/30">
                        <div className="space-y-1.5">
                            <Label className="text-zinc-450 text-[10px] uppercase font-bold tracking-wider">Log Seviyesi</Label>
                            <Select value={logLevelFilter} onValueChange={(val) => { setLogLevelFilter(val); setTimeout(() => loadLogs(false), 50); }}>
                                <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-200 rounded-xl h-10 text-xs">
                                    <SelectValue placeholder="Seviye filtrele" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl">
                                    <SelectItem value="Tümü">Tüm Seviyeler</SelectItem>
                                    <SelectItem value="DEBUG">DEBUG</SelectItem>
                                    <SelectItem value="INFO">INFO</SelectItem>
                                    <SelectItem value="WARN">WARN</SelectItem>
                                    <SelectItem value="ERROR">ERROR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-zinc-450 text-[10px] uppercase font-bold tracking-wider">Kategori</Label>
                            <Select value={logCategoryFilter} onValueChange={(val) => { setLogCategoryFilter(val); setTimeout(() => loadLogs(false), 50); }}>
                                <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-zinc-200 rounded-xl h-10 text-xs">
                                    <SelectValue placeholder="Kategori filtrele" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl">
                                    <SelectItem value="Tümü">Tüm Kategoriler</SelectItem>
                                    <SelectItem value="System">System</SelectItem>
                                    <SelectItem value="Command">Command</SelectItem>
                                    <SelectItem value="Error">Error</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Terminal-like log stream */}
                    <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 font-mono text-[11px] h-96 overflow-y-auto space-y-2.5 shadow-inner">
                        {logs.length === 0 ? (
                            <div className="text-zinc-600 text-center py-20">Kayıtlı log bulunamadı.</div>
                        ) : (
                            logs.map((log) => {
                                let badgeColor = "bg-zinc-900 text-zinc-400"
                                if (log.level === "ERROR") badgeColor = "bg-red-500/10 text-red-400 border border-red-500/20"
                                if (log.level === "WARN") badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                if (log.level === "INFO") badgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                
                                return (
                                    <div key={log.id} className="flex items-start gap-2.5 leading-relaxed py-0.5 border-b border-zinc-900/40 hover:bg-zinc-900/20 px-1.5 rounded">
                                        <span className="text-zinc-600 select-none">
                                            {new Date(log.timestamp).toLocaleTimeString("tr-TR")}
                                        </span>
                                        <Badge className={`px-1.5 py-0 rounded text-[9px] font-bold ${badgeColor}`}>
                                            {log.level}
                                        </Badge>
                                        <span className="text-zinc-500 font-semibold select-none">
                                            [{log.category}]
                                        </span>
                                        <span className="text-zinc-300 flex-1 break-all select-all">
                                            {log.message}
                                        </span>
                                        {log.user && (
                                            <span className="text-[10px] text-zinc-500 italic select-none">
                                                @{log.user}
                                            </span>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
