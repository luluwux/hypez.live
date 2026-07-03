"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, ShieldAlert, ListFilter, AlertTriangle } from "lucide-react"

interface AuditLog {
    id: string
    adminId: string
    action: string
    entityId: string | null
    details: string | null
    createdAt: string
}

function formatAction(action: string) {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin?path=admin/logs')
            if (!res.ok) throw new Error(`API responded with ${res.status}`)
            const json = await res.json()
            const payload = json.data ?? json
            setLogs(payload.logs || [])
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch logs'
            setError(message)
            console.error('Failed to fetch logs:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track administrator actions across the platform.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200 flex-1">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchLogs} className="shrink-0">
                        Retry
                    </Button>
                </div>
            )}

            <Card className="border-border bg-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        System Security Logs
                    </CardTitle>
                    <CardDescription>Chronological list of all sensitive administrative actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center py-12 text-muted-foreground text-sm">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <ListFilter className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No audit logs found in the database.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-border/50">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Target ID</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map(log => (
                                        <TableRow key={log.id} className="hover:bg-muted/50">
                                            <TableCell className="text-xs text-zinc-400 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString([], {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-zinc-300">
                                                {log.adminId}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm text-sky-400">
                                                {formatAction(log.action)}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-zinc-400">
                                                {log.entityId || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-xs text-zinc-500 max-w-[200px] truncate">
                                                {log.details ? log.details : '—'}
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
    )
}
