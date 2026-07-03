"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Shield, AlertTriangle } from "lucide-react"

interface BotPermissionItem {
    id: string
    key: string
    name: string
    description: string
    category: string
    isDangerous: boolean
    isActive: boolean
}

interface BotPermissionsTabProps {
    permissions: BotPermissionItem[]
    activePermCategory: string
    setActivePermCategory: (cat: string) => void
    handleTogglePermission: (perm: BotPermissionItem) => Promise<void>
}

export function BotPermissionsTab({
    permissions,
    activePermCategory,
    setActivePermCategory,
    handleTogglePermission
}: BotPermissionsTabProps) {
    const filteredPermissions = permissions.filter(perm => {
        return activePermCategory === "Tümü" || perm.category === activePermCategory
    })

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-zinc-800/50 pb-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-800/80 rounded-lg text-zinc-400 border border-zinc-700/30">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Discord İzinleri</CardTitle>
                                <CardDescription className="text-zinc-500">Botunuzun Discord sunucusunda sahip olacağı izinleri yapılandırın.</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Permission Category Filter */}
                    <div className="flex flex-wrap gap-1.5 border-b border-zinc-800/30 pb-4">
                        {["Tümü", "Kritik", "Yönetim", "Moderasyon", "Temel", "Ses"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActivePermCategory(cat)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    activePermCategory === cat
                                        ? "bg-white text-zinc-950 border-white shadow-sm font-bold"
                                        : "bg-zinc-800/30 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Permissions Cards List */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {filteredPermissions.length === 0 ? (
                            <div className="col-span-2 text-center py-10 text-zinc-500 text-sm">
                                Aradığınız kriterlere uygun izin kaydı bulunmamaktadır.
                            </div>
                        ) : (
                            filteredPermissions.map((perm) => (
                                <div
                                    key={perm.id}
                                    className={`p-4 border rounded-xl flex items-start justify-between gap-4 transition-all ${
                                        perm.isActive 
                                            ? "bg-zinc-900/20 border-zinc-800 hover:border-zinc-700" 
                                            : "bg-zinc-950/10 border-zinc-900/60 opacity-60 hover:opacity-80"
                                    }`}
                                >
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-sm text-zinc-100">{perm.name}</h4>
                                            <Badge className="bg-zinc-800 border border-zinc-700/30 text-zinc-400 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md">
                                                {perm.category}
                                            </Badge>
                                            {perm.isDangerous && (
                                                <Badge className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                    <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                                                    Tehlikeli
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed">{perm.description}</p>
                                        <code className="text-[10px] bg-zinc-950 border border-zinc-800/40 text-zinc-500 px-2 py-0.5 rounded font-mono inline-block">
                                            {perm.key}
                                        </code>
                                    </div>
                                    <Switch
                                        checked={perm.isActive}
                                        onCheckedChange={() => handleTogglePermission(perm)}
                                        className="data-[state=checked]:bg-zinc-100 data-[state=unchecked]:bg-zinc-800 scale-90 mt-1"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
