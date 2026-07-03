import { Card } from "@/components/ui/card";
import { Receipt, Crown, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CARD = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";

export default function BillingPage() {
    return (
        <div className="w-full max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-6 h-6 text-brand-400" />
                Faturalar & Abonelik
            </h1>

            <Card className={`${CARD} border border-white/5 p-6`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10">
                            <Crown className="w-6 h-6 text-zinc-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Standart Plan</h2>
                            <p className="text-sm text-zinc-400">Şu anda ücretsiz planı kullanıyorsunuz.</p>
                        </div>
                    </div>
                    <Button className="bg-brand-500 hover:bg-brand-600 text-white">
                        Premium'a Yükselt
                    </Button>
                </div>
            </Card>

            <Card className={`${CARD} border border-white/5 p-6`}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    Geçmiş Faturalar
                </h3>
                
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <Receipt className="w-8 h-8 text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-sm font-medium">Henüz bir fatura kaydınız bulunmuyor.</p>
                    <p className="text-zinc-500 text-xs mt-1">Premium satın aldığınızda faturalarınız burada listelenecektir.</p>
                </div>
            </Card>
        </div>
    );
}
