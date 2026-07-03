"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Search, Plus, Pencil, Trash2, Activity, Loader2 } from "lucide-react"

interface BotCommandItem {
    id: string
    name: string
    description: string
    category: string
    usage: string
    cooldown: string
    isActive: boolean
    useCount: number
}

interface BotCommandsTabProps {
    commands: BotCommandItem[]
    commandSearch: string
    setCommandSearch: (search: string) => void
    activeCommandCategory: string
    setActiveCommandCategory: (cat: string) => void
    commandModalOpen: boolean
    setCommandModalOpen: (open: boolean) => void
    editingCommand: BotCommandItem | null
    setEditingCommand: (cmd: BotCommandItem | null) => void
    deleteCommandConfirm: BotCommandItem | null
    setDeleteCommandConfirm: (cmd: BotCommandItem | null) => void
    savingCommand: boolean
    handleToggleCommand: (cmd: BotCommandItem) => Promise<void>
    openCreateCommandModal: () => void
    openEditCommandModal: (cmd: BotCommandItem) => void
    handleSaveCommand: () => Promise<void>
    handleDeleteCommand: () => Promise<void>
    cmdName: string
    setCmdName: (name: string) => void
    cmdDesc: string
    setCmdDesc: (desc: string) => void
    cmdCategory: string
    setCmdCategory: (cat: string) => void
    cmdUsage: string
    setCmdUsage: (usage: string) => void
    cmdCooldown: string
    setCmdCooldown: (cooldown: string) => void
}

export function BotCommandsTab({
    commands,
    commandSearch,
    setCommandSearch,
    activeCommandCategory,
    setActiveCommandCategory,
    commandModalOpen,
    setCommandModalOpen,
    editingCommand,
    deleteCommandConfirm,
    setDeleteCommandConfirm,
    savingCommand,
    handleToggleCommand,
    openCreateCommandModal,
    openEditCommandModal,
    handleSaveCommand,
    handleDeleteCommand,
    cmdName,
    setCmdName,
    cmdDesc,
    setCmdDesc,
    cmdCategory,
    setCmdCategory,
    cmdUsage,
    setCmdUsage,
    cmdCooldown,
    setCmdCooldown
}: BotCommandsTabProps) {
    const filteredCommands = commands.filter(cmd => {
        const matchesSearch = cmd.name.toLowerCase().includes(commandSearch.toLowerCase()) || 
                              cmd.description.toLowerCase().includes(commandSearch.toLowerCase())
        const matchesCategory = activeCommandCategory === "Tümü" || cmd.category === activeCommandCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm">
                <CardHeader className="border-b border-zinc-800/50 pb-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-800/80 rounded-lg text-zinc-400 border border-zinc-700/30">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Komut Yönetimi</CardTitle>
                                <CardDescription className="text-zinc-500">Botunuzun komutlarını etkinleştirin, devre dışı bırakın ve yapılandırın.</CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={openCreateCommandModal}
                            className="bg-zinc-100 text-zinc-900 hover:bg-white font-bold rounded-xl px-4 py-2 transition-all flex items-center gap-2 w-max"
                        >
                            <Plus className="h-4 w-4" />
                            Yeni Komut
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Search & Category Filters */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 h-4.5 w-4.5" />
                            <Input
                                value={commandSearch}
                                onChange={(e) => setCommandSearch(e.target.value)}
                                placeholder="Komut ara..."
                                className="bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 transition-all rounded-xl pl-11 h-12 text-sm"
                            />
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {["Tümü", "Moderasyon", "Müzik", "Genel", "Ekonomi"].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCommandCategory(cat)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        activeCommandCategory === cat
                                            ? "bg-white text-zinc-950 border-white shadow-sm font-bold"
                                            : "bg-zinc-800/30 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Commands Table */}
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/20">
                        <Table>
                            <TableHeader className="bg-zinc-900/30 border-b border-zinc-800">
                                <TableRow className="hover:bg-transparent border-zinc-800">
                                    <TableHead className="text-zinc-400 font-bold text-xs uppercase tracking-wider py-4">Komut</TableHead>
                                    <TableHead className="text-zinc-400 font-bold text-xs uppercase tracking-wider py-4">Kategori</TableHead>
                                    <TableHead className="text-zinc-400 font-bold text-xs uppercase tracking-wider py-4">Kullanım</TableHead>
                                    <TableHead className="text-zinc-400 font-bold text-xs uppercase tracking-wider py-4">Cooldown</TableHead>
                                    <TableHead className="text-zinc-400 font-bold text-xs uppercase tracking-wider py-4">Durum</TableHead>
                                    <TableHead className="text-zinc-400 font-bold text-xs uppercase tracking-wider py-4 text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCommands.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={6} className="text-center py-10 text-zinc-500 text-sm">
                                            Aradığınız kriterlere uygun komut bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCommands.map((cmd) => (
                                        <TableRow key={cmd.id} className="border-zinc-800/50 hover:bg-zinc-900/10">
                                            <TableCell className="py-4">
                                                <div className="space-y-1">
                                                    <div className="font-bold text-zinc-100 text-sm">{cmd.name}</div>
                                                    <div className="text-xs text-zinc-500 max-w-xl">{cmd.description}</div>
                                                    <div className="text-[10px] text-zinc-600 font-medium">{cmd.useCount.toLocaleString("tr-TR")} kullanım</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge className="bg-zinc-800/80 border border-zinc-700/30 text-zinc-300 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md">
                                                    {cmd.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <code className="text-xs bg-zinc-950 border border-zinc-800/60 text-zinc-400 px-2.5 py-1 rounded-md font-mono">
                                                    {cmd.usage}
                                                </code>
                                            </TableCell>
                                            <TableCell className="py-4 text-sm font-medium text-zinc-300">
                                                {cmd.cooldown}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={cmd.isActive}
                                                        onCheckedChange={() => handleToggleCommand(cmd)}
                                                        className="data-[state=checked]:bg-zinc-100 data-[state=unchecked]:bg-zinc-800 scale-90"
                                                    />
                                                    {cmd.isActive ? (
                                                        <Badge className="bg-emerald-500/10 border-0 text-emerald-400 p-1 rounded-full">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-zinc-800 text-zinc-600 p-1 rounded-full border-0">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditCommandModal(cmd)}
                                                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteCommandConfirm(cmd)}
                                                        className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Command Modal */}
            <Dialog open={commandModalOpen} onOpenChange={setCommandModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-850 text-zinc-100 rounded-2xl max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editingCommand ? "Komut Düzenle" : "Yeni Komut Ekle"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs">
                            Komut detaylarını girin. Kaydetmek için formu doldurun.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs font-bold">Komut Adı</Label>
                            <Input
                                value={cmdName}
                                onChange={(e) => setCmdName(e.target.value)}
                                placeholder="ban"
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs font-bold">Açıklama</Label>
                            <Input
                                value={cmdDesc}
                                onChange={(e) => setCmdDesc(e.target.value)}
                                placeholder="Kullanıcıyı sunucudan uzaklaştırır."
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs font-bold">Kategori</Label>
                            <Select value={cmdCategory} onValueChange={setCmdCategory}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                                    <SelectValue placeholder="Kategori seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                                    <SelectItem value="Genel">Genel</SelectItem>
                                    <SelectItem value="Moderasyon">Moderasyon</SelectItem>
                                    <SelectItem value="Müzik">Müzik</SelectItem>
                                    <SelectItem value="Ekonomi">Ekonomi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs font-bold">Kullanım Şekli</Label>
                            <Input
                                value={cmdUsage}
                                onChange={(e) => setCmdUsage(e.target.value)}
                                placeholder="!ban @kullanıcı [sebep]"
                                className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl font-mono text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs font-bold">Bekleme Süresi (Cooldown)</Label>
                            <Select value={cmdCooldown} onValueChange={setCmdCooldown}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                                    <SelectValue placeholder="Cooldown seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                                    <SelectItem value="Yok">Yok</SelectItem>
                                    <SelectItem value="1s">1 Saniye</SelectItem>
                                    <SelectItem value="3s">3 Saniye</SelectItem>
                                    <SelectItem value="5s">5 Saniye</SelectItem>
                                    <SelectItem value="10s">10 Saniye</SelectItem>
                                    <SelectItem value="30s">30 Saniye</SelectItem>
                                    <SelectItem value="60s">1 Dakika</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCommandModalOpen(false)}
                            className="border-zinc-850 text-zinc-400 hover:bg-zinc-900 rounded-xl"
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleSaveCommand}
                            disabled={savingCommand || !cmdName.trim() || !cmdDesc.trim() || !cmdUsage.trim()}
                            className="bg-zinc-100 text-zinc-950 hover:bg-white rounded-xl font-bold flex items-center gap-1.5"
                        >
                            {savingCommand && <Loader2 className="h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Command Confirm Modal */}
            <Dialog open={!!deleteCommandConfirm} onOpenChange={(open) => !open && setDeleteCommandConfirm(null)}>
                <DialogContent className="bg-zinc-950 border-zinc-850 text-zinc-100 rounded-2xl max-w-sm p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-400">Komutu Sil</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs">
                            Bu işlem geri alınamaz. <strong>{deleteCommandConfirm?.name}</strong> komutunu silmek istediğinizden emin misiniz?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteCommandConfirm(null)}
                            className="border-zinc-850 text-zinc-400 hover:bg-zinc-900 rounded-xl"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleDeleteCommand}
                            className="bg-red-500 text-white hover:bg-red-650 font-bold rounded-xl"
                        >
                            Evet, Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
