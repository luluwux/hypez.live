"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Settings, Activity, Shield, Loader2, Check, Bot } from "lucide-react"
import { BotGeneralTab } from "./components/BotGeneralTab"
import { BotCommandsTab } from "./components/BotCommandsTab"
import { BotPermissionsTab } from "./components/BotPermissionsTab"
import { BotLogsTab } from "./components/BotLogsTab"

// Types & Interfaces
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

interface BotPermissionItem {
    id: string
    key: string
    name: string
    description: string
    category: string
    isDangerous: boolean
    isActive: boolean
}

interface BotLogItem {
    id: string
    timestamp: string
    level: string
    category: string
    message: string
    user: string | null
}

type TabType = "genel" | "komutlar" | "izinler" | "loglar"

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://hypez.net"

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

export default function BotSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("genel")
    const [loading, setLoading] = useState(true)
    const [savingSettings, setSavingSettings] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Genel Ayarlar States
    const [settings, setSettings] = useState<BotSettingsData | null>(null)
    const [botName, setBotName] = useState("")
    const [prefix, setPrefix] = useState("")
    const [description, setDescription] = useState("")
    const [token, setToken] = useState("")
    const [showToken, setShowToken] = useState(false)
    const [autoStart, setAutoStart] = useState(true)

    // Komutlar States
    const [commands, setCommands] = useState<BotCommandItem[]>([])
    const [commandSearch, setCommandSearch] = useState("")
    const [activeCommandCategory, setActiveCommandCategory] = useState<string>("Tümü")
    const [commandModalOpen, setCommandModalOpen] = useState(false)
    const [editingCommand, setEditingCommand] = useState<BotCommandItem | null>(null)
    const [deleteCommandConfirm, setDeleteCommandConfirm] = useState<BotCommandItem | null>(null)
    const [savingCommand, setSavingCommand] = useState(false)
    
    // Command Form States
    const [cmdName, setCmdName] = useState("")
    const [cmdDesc, setCmdDesc] = useState("")
    const [cmdCategory, setCmdCategory] = useState("Genel")
    const [cmdUsage, setCmdUsage] = useState("")
    const [cmdCooldown, setCmdCooldown] = useState("Yok")

    // İzinler States
    const [permissions, setPermissions] = useState<BotPermissionItem[]>([])
    const [activePermCategory, setActivePermCategory] = useState<string>("Tümü")

    // Loglar States
    const [logs, setLogs] = useState<BotLogItem[]>([])
    const [logLevelFilter, setLogLevelFilter] = useState("Tümü")
    const [logCategoryFilter, setLogCategoryFilter] = useState("Tümü")
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [clearingLogs, setClearingLogs] = useState(false)
    const [fetchingLogs, setFetchingLogs] = useState(false)
    
    // Log Settings States
    const [commandLogs, setCommandLogs] = useState(true)
    const [errorLogs, setErrorLogs] = useState(true)
    const [apiLogs, setApiLogs] = useState(false)
    const [systemLogs, setSystemLogs] = useState(true)
    const [logLevel, setLogLevel] = useState("INFO")
    const [logRetentionDays, setLogRetentionDays] = useState(30)

    const refreshTimer = useRef<NodeJS.Timeout | null>(null)
    const logDownloadRef = useRef<HTMLAnchorElement>(null)
    const [logDownloadUrl, setLogDownloadUrl] = useState<string | null>(null)
    const [logDownloadName, setLogDownloadName] = useState("")

    // Load Bot Settings
    const loadSettings = useCallback(async () => {
        try {
            const data = await adminFetch("GET", "admin/bot/settings")
            if (data) {
                setSettings(data)
                setBotName(data.botName)
                setPrefix(data.prefix)
                setDescription(data.description || "")
                setToken(data.token || "")
                setAutoStart(data.autoStart)
                setCommandLogs(data.commandLogs)
                setErrorLogs(data.errorLogs)
                setApiLogs(data.apiLogs)
                setSystemLogs(data.systemLogs)
                setLogLevel(data.logLevel)
                setLogRetentionDays(data.logRetentionDays)
            }
        } catch (e) {
            console.error("Failed to load bot settings", e)
        }
    }, [])

    // Load Bot Commands
    const loadCommands = useCallback(async () => {
        try {
            const data = await adminFetch("GET", "admin/bot/commands")
            setCommands(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error("Failed to load bot commands", e)
        }
    }, [])

    // Load Bot Permissions
    const loadPermissions = useCallback(async () => {
        try {
            const data = await adminFetch("GET", "admin/bot/permissions")
            setPermissions(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error("Failed to load bot permissions", e)
        }
    }, [])

    // Load Bot Logs
    const loadLogs = useCallback(async (showIndicator = false) => {
        if (showIndicator) setFetchingLogs(true)
        try {
            const queryParams = new URLSearchParams()
            if (logLevelFilter !== "Tümü") queryParams.append("level", logLevelFilter)
            if (logCategoryFilter !== "Tümü") queryParams.append("category", logCategoryFilter)
            
            const path = `admin/bot/logs?${queryParams.toString()}`
            const data = await adminFetch("GET", path)
            setLogs(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error("Failed to load bot logs", e)
        } finally {
            if (showIndicator) setFetchingLogs(false)
        }
    }, [logLevelFilter, logCategoryFilter])

    // Initial Data Fetching
    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await Promise.all([loadSettings(), loadCommands(), loadPermissions(), loadLogs()])
            setLoading(false)
        }
        init()
    }, [loadSettings, loadCommands, loadPermissions, loadLogs])

    // Auto Refresh Logs Effect
    useEffect(() => {
        if (activeTab === "loglar") {
            if (autoRefresh) {
                refreshTimer.current = setInterval(() => {
                    loadLogs(false)
                }, 5000)
            } else {
                if (refreshTimer.current) clearInterval(refreshTimer.current)
            }
        }
        return () => {
            if (refreshTimer.current) clearInterval(refreshTimer.current)
        }
    }, [autoRefresh, activeTab, loadLogs])

    // Save General / Log Settings
    const handleSaveSettings = async (customPayload?: Partial<BotSettingsData>) => {
        setSavingSettings(true)
        setSuccessMessage(null)
        try {
            const payload = customPayload || {
                botName,
                prefix,
                description,
                token,
                autoStart,
                commandLogs,
                errorLogs,
                apiLogs,
                systemLogs,
                logLevel,
                logRetentionDays
            }
            await adminFetch("PATCH", "admin/bot/settings", payload)
            setSuccessMessage("Ayarlar başarıyla kaydedildi.")
            await loadSettings()
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (e) {
            console.error("Failed to save settings", e)
        } finally {
            setSavingSettings(false)
        }
    }

    // Toggle Bot command status
    const handleToggleCommand = async (cmd: BotCommandItem) => {
        try {
            const updated = await adminFetch("PATCH", `admin/bot/commands/${cmd.id}`, {
                isActive: !cmd.isActive
            })
            setCommands(prev => prev.map(c => c.id === cmd.id ? { ...c, isActive: updated.isActive } : c))
        } catch (e) {
            console.error("Failed to toggle command", e)
        }
    }

    // Open Create Command Dialog
    const openCreateCommandModal = () => {
        setEditingCommand(null)
        setCmdName("")
        setCmdDesc("")
        setCmdCategory("Genel")
        setCmdUsage("")
        setCmdCooldown("Yok")
        setCommandModalOpen(true)
    }

    // Open Edit Command Dialog
    const openEditCommandModal = (cmd: BotCommandItem) => {
        setEditingCommand(cmd)
        setCmdName(cmd.name)
        setCmdDesc(cmd.description)
        setCmdCategory(cmd.category)
        setCmdUsage(cmd.usage)
        setCmdCooldown(cmd.cooldown)
        setCommandModalOpen(true)
    }

    // Save Command (Create / Update)
    const handleSaveCommand = async () => {
        if (!cmdName.trim() || !cmdDesc.trim() || !cmdUsage.trim()) return
        setSavingCommand(true)
        try {
            const payload = {
                name: cmdName.trim(),
                description: cmdDesc.trim(),
                category: cmdCategory,
                usage: cmdUsage.trim(),
                cooldown: cmdCooldown
            }

            if (editingCommand) {
                await adminFetch("PATCH", `admin/bot/commands/${editingCommand.id}`, payload)
            } else {
                await adminFetch("POST", "admin/bot/commands", payload)
            }
            setCommandModalOpen(false)
            await loadCommands()
        } catch (e) {
            console.error("Failed to save command", e)
        } finally {
            setSavingCommand(false)
        }
    }

    // Delete Command
    const handleDeleteCommand = async () => {
        if (!deleteCommandConfirm) return
        try {
            await adminFetch("DELETE", `admin/bot/commands/${deleteCommandConfirm.id}`)
            setDeleteCommandConfirm(null)
            await loadCommands()
        } catch (e) {
            console.error("Failed to delete command", e)
        }
    }

    // Toggle Permission
    const handleTogglePermission = async (perm: BotPermissionItem) => {
        try {
            const updated = await adminFetch("PATCH", `admin/bot/permissions/${perm.id}`, {
                isActive: !perm.isActive
            })
            setPermissions(prev => prev.map(p => p.id === perm.id ? { ...p, isActive: updated.isActive } : p))
        } catch (e) {
            console.error("Failed to toggle permission", e)
        }
    }

    // Clear Logs
    const handleClearLogs = async () => {
        setClearingLogs(true)
        try {
            await adminFetch("DELETE", "admin/bot/logs")
            await loadLogs()
        } catch (e) {
            console.error("Failed to clear logs", e)
        } finally {
            setClearingLogs(false)
        }
    }

    // Download Logs
    const handleDownloadLogs = () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message} ${l.user ? `(User: ${l.user})` : ""}`).join("\n")
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        setLogDownloadName(`hypez_bot_logs_${new Date().toISOString().split('T')[0]}.log`)
        setLogDownloadUrl(url)
    }

    useEffect(() => {
        if (logDownloadUrl && logDownloadRef.current) {
            logDownloadRef.current.click()
            URL.revokeObjectURL(logDownloadUrl)
            setLogDownloadUrl(null)
        }
    }, [logDownloadUrl])

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm font-medium animate-pulse">Bot ayarları yükleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Hidden download anchor — avoids direct DOM manipulation */}
            <a
                ref={logDownloadRef}
                href={logDownloadUrl ?? "#"}
                download={logDownloadName}
                aria-hidden="true"
                className="sr-only"
            />
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
                        Bot Ayarları
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Botunuzun ayarlarını yapılandırın ve yönetin.
                    </p>
                </div>
                {successMessage && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium animate-fade-in shadow-lg">
                        <Check className="h-4 w-4" />
                        {successMessage}
                    </div>
                )}
            </div>

            {/* Custom Tab Navigation */}
            <div className="flex gap-2 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/80 w-full md:w-auto overflow-x-auto">
                {(["genel", "komutlar", "izinler", "loglar"] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${
                            activeTab === tab
                                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                        }`}
                    >
                        {tab === "genel" && <Settings className="h-4 w-4" />}
                        {tab === "komutlar" && <Activity className="h-4 w-4" />}
                        {tab === "izinler" && <Shield className="h-4 w-4" />}
                        {tab === "loglar" && <Activity className="h-4 w-4" />}
                        {tab === "loglar" ? "Loglar" : tab}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
                
                {/* 1. GENEL AYARLAR SEKMESİ */}
                {activeTab === "genel" && (
                    <BotGeneralTab
                        botName={botName}
                        setBotName={setBotName}
                        prefix={prefix}
                        setPrefix={setPrefix}
                        description={description}
                        setDescription={setDescription}
                        token={token}
                        setToken={setToken}
                        showToken={showToken}
                        setShowToken={setShowToken}
                        autoStart={autoStart}
                        setAutoStart={setAutoStart}
                        savingSettings={savingSettings}
                        handleSaveSettings={handleSaveSettings}
                        WEB_URL={WEB_URL}
                        guildId={settings?.id}
                    />
                )}

                {/* 2. KOMUT YÖNETİMİ SEKMESİ */}
                {activeTab === "komutlar" && (
                    <BotCommandsTab
                        commands={commands}
                        commandSearch={commandSearch}
                        setCommandSearch={setCommandSearch}
                        activeCommandCategory={activeCommandCategory}
                        setActiveCommandCategory={setActiveCommandCategory}
                        commandModalOpen={commandModalOpen}
                        setCommandModalOpen={setCommandModalOpen}
                        editingCommand={editingCommand}
                        setEditingCommand={setEditingCommand}
                        deleteCommandConfirm={deleteCommandConfirm}
                        setDeleteCommandConfirm={setDeleteCommandConfirm}
                        savingCommand={savingCommand}
                        handleToggleCommand={handleToggleCommand}
                        openCreateCommandModal={openCreateCommandModal}
                        openEditCommandModal={openEditCommandModal}
                        handleSaveCommand={handleSaveCommand}
                        handleDeleteCommand={handleDeleteCommand}
                        cmdName={cmdName}
                        setCmdName={setCmdName}
                        cmdDesc={cmdDesc}
                        setCmdDesc={setCmdDesc}
                        cmdCategory={cmdCategory}
                        setCmdCategory={setCmdCategory}
                        cmdUsage={cmdUsage}
                        setCmdUsage={setCmdUsage}
                        cmdCooldown={cmdCooldown}
                        setCmdCooldown={setCmdCooldown}
                    />
                )}

                {/* 3. DISCORD İZİNLERİ SEKMESİ */}
                {activeTab === "izinler" && (
                    <BotPermissionsTab
                        permissions={permissions}
                        activePermCategory={activePermCategory}
                        setActivePermCategory={setActivePermCategory}
                        handleTogglePermission={handleTogglePermission}
                    />
                )}

                {/* 4. CANLI LOG AKIŞI SEKMESİ */}
                {activeTab === "loglar" && (
                    <BotLogsTab
                        logs={logs}
                        logLevelFilter={logLevelFilter}
                        setLogLevelFilter={setLogLevelFilter}
                        logCategoryFilter={logCategoryFilter}
                        setLogCategoryFilter={setLogCategoryFilter}
                        autoRefresh={autoRefresh}
                        setAutoRefresh={setAutoRefresh}
                        clearingLogs={clearingLogs}
                        fetchingLogs={fetchingLogs}
                        handleClearLogs={handleClearLogs}
                        handleDownloadLogs={handleDownloadLogs}
                        loadLogs={loadLogs}
                        commandLogs={commandLogs}
                        setCommandLogs={setCommandLogs}
                        errorLogs={errorLogs}
                        setErrorLogs={setErrorLogs}
                        apiLogs={apiLogs}
                        setApiLogs={setApiLogs}
                        systemLogs={systemLogs}
                        setSystemLogs={setSystemLogs}
                        logLevel={logLevel}
                        setLogLevel={setLogLevel}
                        logRetentionDays={logRetentionDays}
                        setLogRetentionDays={setLogRetentionDays}
                        savingSettings={savingSettings}
                        handleSaveSettings={handleSaveSettings}
                    />
                )}
            </div>
        </div>
    )
}
