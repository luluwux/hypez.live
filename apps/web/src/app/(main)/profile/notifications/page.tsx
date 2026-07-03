"use client";

import { Card } from "@/components/ui/card";
import { Bell, Mail, Smartphone, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const CARD = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";

export default function NotificationsPage() {
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [emailMarketing, setEmailMarketing] = useState(false);
    const [browserNotifs, setBrowserNotifs] = useState(true);

    return (
        <div className="w-full max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-brand-400" />
                Bildirim Ayarları
            </h1>

            <div className="p-4 rounded-xl flex items-start gap-3 border border-brand-500/20 bg-brand-500/5">
                <AlertCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-brand-200 text-sm font-semibold">Bildirim tercihleri</p>
                    <p className="text-brand-400/70 text-xs mt-1">
                        Sistem güncellemeleri, sunucu onayları ve destek talepleriyle ilgili bildirimleri nasıl almak istediğinizi buradan yönetebilirsiniz.
                    </p>
                </div>
            </div>

            <Card className={`${CARD} border border-white/5 p-6 space-y-6`}>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-4 border-b border-white/5">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    E-posta Bildirimleri
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-white">Hesap Güncellemeleri</h4>
                            <p className="text-xs text-zinc-400">Sunucunuz onaylandığında veya önemli hesap uyarılarında e-posta alın.</p>
                        </div>
                        <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-white">Pazarlama & Promosyonlar</h4>
                            <p className="text-xs text-zinc-400">Yeni özellikler ve indirimler hakkında e-posta alın.</p>
                        </div>
                        <Switch checked={emailMarketing} onCheckedChange={setEmailMarketing} />
                    </div>
                </div>
            </Card>

            <Card className={`${CARD} border border-white/5 p-6 space-y-6`}>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-4 border-b border-white/5">
                    <Smartphone className="w-4 h-4 text-zinc-400" />
                    Tarayıcı Bildirimleri
                </h3>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium text-white">Anlık Bildirimler</h4>
                        <p className="text-xs text-zinc-400">Siteyi kullanırken sağ altta çıkan anlık bildirimleri göster.</p>
                    </div>
                    <Switch checked={browserNotifs} onCheckedChange={setBrowserNotifs} />
                </div>
            </Card>
        </div>
    );
}
