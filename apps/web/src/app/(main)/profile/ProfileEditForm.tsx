"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, publishProfile, type UpdateProfilePayload } from "./actions";
import { toast } from "sonner";
import { UserBadges } from "@/components/user/UserBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    User, Briefcase, MapPin, Cake, Globe,
    Save, Megaphone, Eye, Heart, Shield, Clock,
    Loader2, ArrowLeft, ExternalLink, CalendarDays,
    Plus, Trash2
} from "lucide-react";
import { getSocialLinkInfo } from "@/lib/social-links";
import { useTranslation } from "@/lib/i18n/hooks";

const CARD = "bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]";
const INPUT = "bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-brand-500/50";

function renderBold(text: string) {
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
}

export interface ProfileFormUser {
    id: string;
    name: string | null;
    image: string | null;
    banner: string | null;
    role: string;
    createdAt: string;
    discordJoinDate: string | null;
    occupation: string | null;
    gender: string | null;
    location: string | null;
    birthday: string | null;
    about: string | null;
    socialLinks: string[] | null;
    isPublished: boolean;
    badges: string[];
    profileViews: number;
    likeCount: number;
    trustScore: number;
    hypePoints: number;
    premiumLevel: number;
}

function EmptyTag({ t }: { t: any }) {
    return (
        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-500/60 border border-amber-500/20 rounded px-1 py-0.5">
            {t('profile.editForm.notAddedYet')}
        </span>
    );
}

function completionScore(u: ProfileFormUser): number {
    const hasSocialLink = (u.socialLinks || []).some(l => l.trim() !== "");
    const fields = [u.occupation, u.gender, u.location, u.birthday, u.about, hasSocialLink];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / 6) * 100);
}

export function ProfileEditForm({ user: initial, highlightPublish = false }: { user: ProfileFormUser; highlightPublish?: boolean }) {
    const router = useRouter();
    const { t } = useTranslation();

    const maxBirthdayDate = new Date();
    maxBirthdayDate.setFullYear(maxBirthdayDate.getFullYear() - 13);
    const maxBirthdayString = maxBirthdayDate.toISOString().split("T")[0];

    const [occupation, setOccupation] = useState(initial.occupation ?? "");
    const [gender, setGender] = useState(initial.gender ?? "");
    const [location, setLocation] = useState(initial.location ?? "");
    const [birthday, setBirthday] = useState(initial.birthday ?? "");
    const [about, setAbout] = useState(initial.about ?? "");
    const [socialLinks, setSocialLinks] = useState<string[]>(initial.socialLinks ?? []);

    useEffect(() => {
        if (highlightPublish && !initial.isPublished) {
            document.getElementById("publish-actions")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [highlightPublish, initial.isPublished]);

    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(initial.isPublished);

    const isDirty = 
        occupation !== (initial.occupation ?? "") ||
        gender !== (initial.gender ?? "") ||
        location !== (initial.location ?? "") ||
        birthday !== (initial.birthday ?? "") ||
        about !== (initial.about ?? "") ||
        JSON.stringify(socialLinks.filter(l => l.trim() !== "")) !== JSON.stringify(initial.socialLinks ?? []);

    const handleCancel = () => {
        setOccupation(initial.occupation ?? "");
        setGender(initial.gender ?? "");
        setLocation(initial.location ?? "");
        setBirthday(initial.birthday ?? "");
        setAbout(initial.about ?? "");
        setSocialLinks(initial.socialLinks ?? []);
    };

    // Live completion score based on current form state
    const hasSocialLink = socialLinks.some(l => l.trim() !== "");
    const liveScore = Math.round(
        ([occupation, gender, location, birthday, about, hasSocialLink].filter(Boolean).length / 6) * 100
    );

    const handleSave = useCallback(async () => {
        const filtered = socialLinks.filter(l => l.trim() !== "");
        if (filtered.length > 10) {
            toast.error("En fazla 10 sosyal bağlantı ekleyebilirsiniz.");
            return;
        }
        for (const link of filtered) {
            const lower = link.toLowerCase().trim();
            if (lower.includes("discord.gg/") || lower.includes("discord.com/invite/")) {
                toast.error("Discord davet bağlantıları yasaktır.");
                return;
            }
            if (lower.includes(`/users/${initial.id}`)) {
                toast.error("Kendi profil adresinizi ekleyemezsiniz.");
                return;
            }
        }

        setSaving(true);

        const payload: UpdateProfilePayload = {
            occupation: occupation || null,
            gender: gender || null,
            location: location || null,
            birthday: birthday || null,
            about: about || null,
            socialLinks: filtered.length > 0 ? filtered : null,
        };

        const result = await updateProfile(payload);
        if (result.ok) {
            toast.success(t('profile.editForm.successSave'));
        } else {
            toast.error(result.error ?? t('profile.editForm.errorSave'));
        }
        setSaving(false);
    }, [occupation, gender, location, birthday, about, socialLinks, initial.id]);

    const addSocialLink = () => setSocialLinks([...socialLinks, ""]);
    
    const updateSocialLink = (index: number, val: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = val;
        setSocialLinks(newLinks);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handlePublish = useCallback(async () => {
        setPublishing(true);
        const result = await publishProfile();
        if (result.ok) {
            setIsPublished(true);
            toast.success(t('profile.editForm.successPublish'));
        } else {
            toast.error(result.error ?? t('profile.editForm.errorPublish'));
        }
        setPublishing(false);
    }, []);

    const fmtDate = (iso: string | null) => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
    };

    return (
        <div className="w-full">



                {/* ── Discord Identity Card ── */}
                <Card className={`${CARD} border border-white/5 p-6 mb-6`}>
                    <div className="flex items-center gap-5">
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-brand-500/40">
                                {initial.image ? (
                                    <img
                                        src={initial.image}
                                        alt={initial.name ?? ""}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {initial.name?.charAt(0).toUpperCase() ?? "U"}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-white truncate">{initial.name ?? t('profile.editForm.unknown')}</h1>
                            <UserBadges user={initial as any} className="mt-1" />

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                {initial.discordJoinDate && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays className="w-3 h-3 text-[#5865F2]" />
                                        Discord: {fmtDate(initial.discordJoinDate)}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-brand-400" />
                                    Hypez: {fmtDate(initial.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="mt-5 mb-6 pt-5 flex items-center gap-5 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {initial.profileViews.toLocaleString("tr-TR")} {t('profile.editForm.views')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" />
                        {initial.likeCount.toLocaleString("tr-TR")} {t('profile.editForm.likes')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        {t('profile.editForm.trust')} {initial.trustScore}%
                    </span>
                </div>

                {/* Completion bar */}
                {liveScore < 100 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-zinc-500">{t('profile.editForm.profileCompletion')}</span>
                            <span className={`text-xs font-semibold ${liveScore >= 70 ? "text-green-400" : liveScore >= 40 ? "text-amber-400" : "text-red-400"}`}>
                                %{liveScore}
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${liveScore >= 70 ? "bg-green-500" : liveScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${liveScore}%` }}
                            />
                        </div>
                    </div>
                )}

                    {/* Not published warning */}
                    {!isPublished && (
                        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                            highlightPublish
                                ? "border-amber-400/40 bg-amber-500/10 ring-1 ring-amber-400/30"
                                : "border-amber-500/20 bg-amber-500/5"
                        }`}>
                            <Megaphone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-200 text-sm font-semibold">
                                    {highlightPublish ? t('profile.editForm.notPublishedTitleHighlight') : t('profile.editForm.notPublishedTitle')}
                                </p>
                                <p className="text-amber-400/70 text-xs mt-1">{renderBold(t('profile.editForm.notPublishedDesc'))}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Profile Info Form ── */}
                    <Card className={`${CARD} border border-white/5 p-6 mb-6`}>
                    <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                        <User className="w-4 h-4 text-brand-400" />
                        {t('profile.editForm.profileInfo')}
                    </h2>

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="occupation" className="text-zinc-300 text-sm mb-1.5 flex items-center">
                                    <Briefcase className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                    {t('profile.editForm.occupation')}
                                    {!occupation && <EmptyTag t={t} />}
                                </Label>
                                <Input
                                    id="occupation"
                                    value={occupation}
                                    onChange={e => setOccupation(e.target.value)}
                                    placeholder={t('profile.editForm.occupationPlaceholder')}
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <Label htmlFor="gender" className="text-zinc-300 text-sm mb-1.5 flex items-center">
                                    {t('profile.editForm.gender')}
                                    {!gender && <EmptyTag t={t} />}
                                </Label>
                                <Select value={gender} onValueChange={setGender}>
                                    <SelectTrigger className={INPUT}>
                                        <SelectValue placeholder={t('profile.editForm.genderPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0e0f11] border-white/10 text-white">
                                        <SelectItem value="he">{t('profile.editForm.genderOptions.he')}</SelectItem>
                                        <SelectItem value="she">{t('profile.editForm.genderOptions.she')}</SelectItem>
                                        <SelectItem value="they">{t('profile.editForm.genderOptions.they')}</SelectItem>
                                        <SelectItem value="unspecified">{t('profile.editForm.genderOptions.unspecified')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="location" className="text-zinc-300 text-sm mb-1.5 flex items-center">
                                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                    {t('profile.editForm.location')}
                                    {!location && <EmptyTag t={t} />}
                                </Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder={t('profile.editForm.locationPlaceholder')}
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <Label htmlFor="birthday" className="text-zinc-300 text-sm mb-1.5 flex items-center">
                                    <Cake className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                    {t('profile.editForm.birthday')}
                                    {!birthday && <EmptyTag t={t} />}
                                </Label>
                                <Input
                                    id="birthday"
                                    type="date"
                                    min="1900-01-01"
                                    max={maxBirthdayString}
                                    value={birthday}
                                    onChange={e => setBirthday(e.target.value)}
                                    className={INPUT}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label htmlFor="about" className="text-zinc-300 text-sm flex items-center">
                                    {t('profile.editForm.about')}
                                    {!about && <EmptyTag t={t} />}
                                </Label>
                                <span className={`text-xs ${about.length > 450 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                    {about.length}/500
                                </span>
                            </div>
                            <Textarea
                                id="about"
                                value={about}
                                onChange={e => setAbout(e.target.value.slice(0, 500))}
                                placeholder={t('profile.editForm.aboutPlaceholder')}
                                rows={4}
                                className={INPUT}
                            />
                        </div>
                    </div>
                </Card>

                {/* ── Social Links ── */}
                <Card className={`${CARD} border border-white/5 p-6 mb-6`}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-brand-400" />
                            {t('profile.editForm.socialLinks')}
                        </h2>
                        <Button onClick={addSocialLink} variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white">
                            <Plus className="w-4 h-4 mr-1.5" /> {t('profile.editForm.addLink')}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {socialLinks.length === 0 && (
                            <div className="text-center p-6 border border-white/5 rounded-xl bg-white/[0.02]">
                                <p className="text-sm text-zinc-500">{t('profile.editForm.noLinks')}</p>
                            </div>
                        )}
                        {socialLinks.map((url, i) => {
                            const { icon: Icon } = getSocialLinkInfo(url || "https://");
                            return (
                                <div key={i} className="flex items-center gap-3 relative group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-zinc-300" />
                                    </div>
                                    <Input
                                        value={url}
                                        onChange={e => updateSocialLink(i, e.target.value)}
                                        placeholder="https://..."
                                        className={INPUT}
                                    />
                                    <Button
                                        onClick={() => removeSocialLink(i)}
                                        variant="ghost"
                                        size="icon"
                                        className="flex-shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {!isPublished && (
                        <div id="publish-actions" className="flex flex-col gap-3">
                            <Button
                                onClick={handlePublish}
                                disabled={publishing}
                                variant="outline"
                                className="border-green-500/30 text-green-300 hover:bg-green-500/10 hover:text-green-200 w-full"
                            >
                                {publishing
                                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    : <Megaphone className="w-4 h-4 mr-2" />
                                }
                                {t('profile.editForm.publishProfile')}
                            </Button>
                        </div>
                    )}
                </Card>

                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-500 ease-out ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
                    <div className="text-sm font-medium text-zinc-300">
                        {t('profile.editForm.unsavedChanges')}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={handleCancel} className="flex-1 sm:flex-none text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10">
                            {t('profile.editForm.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none bg-brand-500 hover:bg-brand-600 text-white">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {t('profile.editForm.save')}
                        </Button>
                    </div>
                </div>
        </div>
    );
}
