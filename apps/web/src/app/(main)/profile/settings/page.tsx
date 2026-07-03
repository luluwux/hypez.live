"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Settings, Globe, ShieldAlert, Trash2, Check, Ticket, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage, useTranslation } from "@/lib/i18n/hooks";
import { useNsfwPreference } from "@/components/auth/user-menu";
import type { Language } from "@/lib/i18n/context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const CARD = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";

const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export default function SettingsPage() {
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();
    const { nsfwEnabled, setNsfwEnabled } = useNsfwPreference();
    const { data: session } = useSession();
    const token = session?.apiToken ?? "";

    const [code, setCode] = useState("");
    const [selectedServerId, setSelectedServerId] = useState("");
    const [servers, setServers] = useState<any[]>([]);
    const [loadingServers, setLoadingServers] = useState(false);
    const [redeeming, setRedeeming] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (token) {
            setLoadingServers(true);
            api.getMyServers(token)
                .then((res) => {
                    setServers(res);
                    if (res.length > 0) {
                        setSelectedServerId(res[0]?.id || "");
                    }
                })
                .catch((err) => {
                    console.error("Error fetching owned servers:", err);
                })
                .finally(() => {
                    setLoadingServers(false);
                });
        }
    }, [token]);

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            toast.error(t('profile.settings.premium.error') || "Lütfen geçerli bir kod girin.");
            return;
        }
        if (!selectedServerId) {
            toast.error("Lütfen premium yapmak istediğiniz sunucuyu seçin.");
            return;
        }

        setRedeeming(true);
        try {
            const res = await api.redeemPremiumCode(code.trim(), selectedServerId, token);
            toast.success(res.message || t('profile.settings.premium.success') || "Premium başarıyla aktif edildi!");
            setCode("");
            
            // Refresh owned servers list to reflect changes in UI
            const updatedServers = await api.getMyServers(token);
            setServers(updatedServers);
        } catch (err: any) {
            toast.error(err.message || t('profile.settings.premium.error') || "Aktivasyon başarısız oldu.");
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-brand-400" />
                {t('profile.settings.title')}
            </h1>

            {/* Premium Kod Aktivasyon Kartı */}
            <Card className={`${CARD} border border-white/5 p-6 space-y-6`}>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-4 border-b border-white/5">
                    <Ticket className="w-4 h-4 text-purple-400" />
                    {t('profile.settings.premium.title') || "Premium Kod Aktivasyonu"}
                </h3>
                
                <form onSubmit={handleRedeem} className="space-y-4 max-w-md">
                    <p className="text-xs text-zinc-400">
                        {t('profile.settings.premium.desc') || "Premium kodunuzu buraya girerek istediğiniz sunucuyu Premium yapabilirsiniz."}
                    </p>
                    
                    <div className="space-y-2">
                        <Label htmlFor="premium-code" className="text-zinc-300 text-sm">Premium Kod</Label>
                        <Input
                            id="premium-code"
                            type="text"
                            placeholder={t('profile.settings.premium.inputPlaceholder') || "Örn: HYPEZ-XXXX-XXXX-XXXX"}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="bg-black border-white/10 text-white focus:border-purple-500 font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300 text-sm">
                            {t('profile.settings.premium.selectServer') || "Premium yapılacak sunucuyu seçin"}
                        </Label>
                        
                        {loadingServers ? (
                            <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                Sunucular yükleniyor...
                            </div>
                        ) : servers.length === 0 ? (
                            <div className="text-zinc-500 text-xs italic py-2">
                                {t('profile.settings.premium.noServers') || "Sahip olduğunuz aktif bir sunucu bulunmamaktadır."}
                            </div>
                        ) : (
                            <Select value={selectedServerId} onValueChange={setSelectedServerId}>
                                <SelectTrigger className="w-full bg-black border-white/10 text-white focus:border-purple-500">
                                    <SelectValue placeholder="Sunucu seçin" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#050505] border-white/10 text-white">
                                    {servers.map((server) => (
                                        <SelectItem key={server.id} value={server.id} className="hover:bg-white/5 focus:bg-white/5">
                                            <span className="flex items-center justify-between w-full">
                                                <span>{server.name}</span>
                                                {server.isPremium && (
                                                    <span className="ml-2 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                                                        Premium ({mounted && server.premiumExpiresAt ? new Date(server.premiumExpiresAt).toLocaleDateString() : ""})
                                                    </span>
                                                )}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={redeeming || loadingServers || servers.length === 0}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 mt-2"
                    >
                        {redeeming ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Aktive Ediliyor...
                            </>
                        ) : (
                            <>
                                <Ticket className="w-4 h-4" />
                                {t('profile.settings.premium.redeemBtn') || "Premium'u Aktif Et"}
                            </>
                        )}
                    </Button>
                </form>
            </Card>

            <Card className={`${CARD} border border-white/5 p-6 space-y-6`}>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-4 border-b border-white/5">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    {t('profile.settings.language.title')}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                language === lang.code
                                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                                    : "border-white/5 bg-black/40 hover:bg-white/5 text-zinc-400"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-lg">{lang.flag}</span>
                                <span className="font-medium text-sm">{lang.label}</span>
                            </span>
                            {language === lang.code && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            </Card>

            <Card className={`${CARD} border border-white/5 p-6 space-y-6`}>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-4 border-b border-white/5">
                    <ShieldAlert className="w-4 h-4 text-zinc-400" />
                    {t('profile.settings.contentFilter.title')}
                </h3>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            {t('profile.settings.contentFilter.nsfw')}
                            {nsfwEnabled && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">18+</span>}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">{t('profile.settings.contentFilter.nsfwDesc')}</p>
                    </div>
                    <Switch checked={nsfwEnabled} onCheckedChange={setNsfwEnabled} className="data-[state=checked]:bg-red-500" />
                </div>
            </Card>

            <Card className="bg-red-500/5 border border-red-500/20 p-6 space-y-6">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 pb-4 border-b border-red-500/20">
                    <Trash2 className="w-4 h-4" />
                    {t('profile.settings.dangerZone.title')}
                </h3>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-medium text-white">{t('profile.settings.dangerZone.deleteAccount')}</h4>
                        <p className="text-xs text-zinc-400 mt-1">
                            {t('profile.settings.dangerZone.deleteDesc')}
                        </p>
                    </div>
                    <Button variant="destructive" className="flex-shrink-0" onClick={() => alert(t('profile.settings.dangerZone.alert'))}>
                        {t('profile.settings.dangerZone.deleteBtn')}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
