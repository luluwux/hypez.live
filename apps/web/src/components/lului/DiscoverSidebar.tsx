import { Hash, ShieldAlert, Globe } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { FALLBACK_CATEGORIES, type Category } from "@hypez/shared-types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/hooks";
import { useMemo } from "react";

interface DiscoverSidebarProps {
    selectedCategory: string;
    selectedLanguage: string;
    showNsfw: boolean;
    onCategoryChange: (c: string) => void;
    onLanguageChange: (l: string) => void;
    onNsfwChange: (v: boolean) => void;
}

export function DiscoverSidebar({
    selectedCategory,
    selectedLanguage,
    showNsfw,
    onCategoryChange,
    onLanguageChange,
    onNsfwChange
}: DiscoverSidebarProps) {
    const { t } = useTranslation();

    const languages = useMemo(() => [
        { value: 'all', label: t('languages.all'), flag: '🌐' },
        { value: 'tr', label: t('languages.tr'), flag: '🇹🇷' },
        { value: 'en-US', label: t('languages.en_US'), flag: '🇺🇸' },
        { value: 'en-GB', label: t('languages.en_GB'), flag: '🇬🇧' },
        { value: 'de', label: t('languages.de'), flag: '🇩🇪' },
        { value: 'fr', label: t('languages.fr'), flag: '🇫🇷' },
        { value: 'es-ES', label: t('languages.es'), flag: '🇪🇸' },
        { value: 'pt-BR', label: t('languages.pt'), flag: '🇧🇷' },
        { value: 'ru', label: t('languages.ru'), flag: '🇷🇺' },
        { value: 'ja', label: t('languages.ja'), flag: '🇯🇵' },
        { value: 'ko', label: t('languages.ko'), flag: '🇰🇷' },
        { value: 'zh-CN', label: t('languages.zh'), flag: '🇨🇳' },
        { value: 'ar', label: t('languages.ar'), flag: '🇸🇦' },
    ], [t]);

    return (
        <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-6">
            <div className="bg-[#151618] border border-white/5 rounded-2xl p-5 space-y-6">

                {/* Category */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white">
                        <Hash className="w-4 h-4 text-sky-500" />
                        <h3 className="font-bold text-sm">{t('discover.filters.category')}</h3>
                    </div>
                    <Select value={selectedCategory} onValueChange={onCategoryChange}>
                        <SelectTrigger className="w-full bg-[#1e1f22] border-white/5 h-11 text-zinc-300">
                            <SelectValue placeholder={t('discover.filters.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1f22] border-white/5 text-zinc-300">
                            <SelectItem value="all">🌐 {t('discover.filters.all')}</SelectItem>
                            {FALLBACK_CATEGORIES.filter((c: Category) => c.isActive).map((cat: Category) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    <span className="flex items-center gap-2"><CategoryIcon name={cat.emoji} className="w-3.5 h-3.5" /> {cat.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Language */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-sm">{t('discover.filters.language')}</h3>
                    </div>
                    <Select value={selectedLanguage} onValueChange={onLanguageChange}>
                        <SelectTrigger className="w-full bg-[#1e1f22] border-white/5 h-11 text-zinc-300">
                            <SelectValue placeholder={t('discover.filters.allLanguages')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1f22] border-white/5 text-zinc-300">
                            {languages.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.flag} {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Separator */}
                <div className="h-px w-full bg-white/5" />

                {/* NSFW Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        <Label htmlFor="nsfw-toggle" className="text-sm font-medium cursor-pointer">
                            {t('discover.filters.nsfw')}
                        </Label>
                    </div>
                    <Switch
                        id="nsfw-toggle"
                        checked={showNsfw}
                        onCheckedChange={onNsfwChange}
                        className="data-[state=checked]:bg-red-500"
                    />
                </div>

            </div>
        </div>
    );
}
