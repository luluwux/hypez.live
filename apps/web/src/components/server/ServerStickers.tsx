"use client";

import { useState, useCallback } from "react";
import { Download, CheckCircle2, Circle, Package, X, Sticker } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Server } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/hooks";
import JSZip from "jszip";

const CARD_GRADIENT = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";

interface ServerStickersProps {
    server: Server;
}

export function ServerStickers({ server }: ServerStickersProps) {
    const { t } = useTranslation();
    const stickers = server.stickers ?? [];
    const hasStickerCount = (server.stickerCount ?? 0) > 0;
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);

    const toggleSelect = useCallback((stickerId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(stickerId)) next.delete(stickerId);
            else next.add(stickerId);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(stickers.map(s => s.id)));
    }, [stickers]);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const downloadSingle = useCallback(async (url: string, filename: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch {
            window.open(url, '_blank');
        }
    }, []);

    const downloadSelectedAsZip = useCallback(async () => {
        const selected = stickers.filter(s => selectedIds.has(s.id));
        if (selected.length === 0) return;

        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder(server.name.replace(/[^a-zA-Z0-9]/g, '_') + '_stickers')!;

            const downloads = await Promise.all(
                selected.map(async (sticker) => {
                    try {
                        const res = await fetch(sticker.url);
                        const blob = await res.blob();
                        const ext = sticker.format === 'APNG' ? 'apng' : 'png';
                        folder.file(`${sticker.name}.${ext}`, blob);
                        return true;
                    } catch {
                        return false;
                    }
                })
            );

            const successCount = downloads.filter(Boolean).length;
            if (successCount > 0) {
                const content = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = `${server.name.replace(/[^a-zA-Z0-9]/g, '_')}_stickers.zip`;
                a.click();
                URL.revokeObjectURL(a.href);
            }
        } finally {
            setIsDownloading(false);
        }
    }, [stickers, selectedIds, server.name]);

    if (stickers.length === 0) {
        if (hasStickerCount) {
            return (
                <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-12 text-center")}>
                    <Sticker className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-zinc-300 text-lg font-semibold">{t('server.stickers.found', { count: server.stickerCount?.toLocaleString() ?? 0 })}</p>
                    <p className="text-zinc-500 text-sm mt-1">{t('server.stickers.pendingSync')}</p>
                </div>
            );
        }
        return (
            <div className={cn(CARD_GRADIENT, "border border-white/5 rounded-2xl p-12 text-center")}>
                <Sticker className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 text-lg">{t('server.stickers.empty')}</p>
                <p className="text-zinc-600 text-sm mt-1">{t('server.stickers.pendingSync')}</p>
            </div>
        );
    }

    const selectedCount = selectedIds.size;

    return (
        <div className="space-y-4 mt-8">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-sm font-medium">
                        {t('server.stickers.found', { count: stickers.length })}
                        {selectedCount > 0 && (
                            <span className="text-brand-400 ml-1">({t('server.stickers.selected', { count: selectedCount })})</span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {selectedCount > 0 ? (
                        <>
                            <button
                                onClick={deselectAll}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-[#1e1f22] border border-white/5 hover:border-white/10 transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                                {t('server.stickers.clearSelection')}
                            </button>
                            <button
                                onClick={downloadSelectedAsZip}
                                disabled={isDownloading}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-all disabled:opacity-50"
                            >
                                <Package className="w-3.5 h-3.5" />
                                {isDownloading ? t('server.stickers.downloading') : t('server.stickers.downloadZip', { count: selectedCount })}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={selectAll}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-[#1e1f22] border border-white/5 hover:border-white/10 transition-all"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('server.stickers.selectAll')}
                        </button>
                    )}
                </div>
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {stickers.map((sticker) => {
                    const isSelected = selectedIds.has(sticker.id);
                    return (
                        <div
                            key={sticker.id}
                            className={cn(
                                "group relative aspect-square rounded-xl border transition-all duration-200 cursor-pointer",
                                isSelected
                                    ? "border-brand-500/50 bg-brand-500/10 ring-1 ring-brand-500/30"
                                    : "border-white/5 bg-[#1e1f22] hover:border-white/20 hover:bg-[#252629]"
                            )}
                            onClick={() => toggleSelect(sticker.id)}
                        >
                            {/* Checkbox */}
                            <div className={cn(
                                "absolute top-1.5 right-1.5 z-10 transition-all",
                                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
                            )}>
                                <div className={cn(
                                    "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                                    isSelected ? "bg-brand-500 text-white" : "bg-black/60 text-white/70 border border-white/20"
                                )}>
                                    {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                </div>
                            </div>

                            {/* Sticker Image */}
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <Image
                                    src={sticker.url}
                                    alt={sticker.name}
                                    width={64}
                                    height={64}
                                    className="object-contain max-w-full max-h-full group-hover:scale-110 transition-transform"
                                    unoptimized
                                />
                            </div>

                            {/* Format Badge */}
                            {sticker.format && (
                                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-white/5">
                                    {sticker.format}
                                </div>
                            )}

                            {/* Download button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const ext = sticker.format === 'APNG' ? 'apng' : 'png';
                                    downloadSingle(sticker.url, `${sticker.name}.${ext}`);
                                }}
                                className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white/70 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
                                title={t('common.download')}
                            >
                                <Download className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
