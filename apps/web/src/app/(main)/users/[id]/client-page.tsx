"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api, type UserProfile } from "@/lib/api";
import Image from "next/image";
import { UserBadges } from "@/components/user/UserBadges";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Heart, Eye, MapPin, Briefcase, Cake, Loader2, Edit2,
  ArrowLeft, Users, ExternalLink, AlertTriangle, Download
} from "lucide-react";
import { getSocialLinkInfo } from "@/lib/social-links";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";
interface UserProfileClientProps {
  profile: UserProfile;
  userId: string;
}

export function UserProfileClient({ profile: initialProfile, userId }: UserProfileClientProps) {
  const { data: session, status } = useSession();
  const token = session?.apiToken ?? "";
  const { t, language } = useTranslation();

  const [profile] = useState<UserProfile>(initialProfile);
  const [liked, setLiked] = useState(initialProfile.hasLiked ?? false);
  const [likeCount, setLikeCount] = useState(initialProfile.likeCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  
  // External link modal state
  const [externalLink, setExternalLink] = useState<string | null>(null);

  useEffect(() => {
    if (viewRecorded) return;
    if (session?.user?.id !== userId) {
      api.recordProfileView(userId, token || undefined);
      setViewRecorded(true);
    }
  }, [token, userId, viewRecorded, session?.user?.id]);

  const handleLike = useCallback(async () => {
    if (status === "loading") return;
    if (!token) {
      toast.error(t('userProfile.loginRequired'));
      return;
    }
    setLikeLoading(true);
    try {
      const result = await api.toggleProfileLike(userId, token);
      setLiked(result.liked);
      setLikeCount(result.likes);
      if (result.liked) {
        toast.success(t('userProfile.likeSuccess'));
      } else {
        toast.info(t('userProfile.likeRemoved'));
      }
    } catch (err) {
      toast.error(t('userProfile.error'));
    } finally { 
      setLikeLoading(false); 
    }
  }, [token, userId, status]);

  const isOwner = session?.user?.id === userId;

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    const date = new Date(iso);
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(locale, {
      month: "long", day: "numeric",
    });
  };

  const bannerUrl = (profile as UserProfile & { banner?: string | null }).banner ?? null;
  const likeLoadingState = status === "loading" || likeLoading;

  return (
    <div className="min-h-screen pb-20 pt-28">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">

        {/* Back link */}
        <Link
          href="/servers"
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('userProfile.goBack')}
        </Link>

        <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808] border border-white/5 shadow-2xl">
          {/* Banner */}
          <div className={cn("relative h-48 md:h-64 w-full overflow-hidden", bannerUrl && "cursor-pointer")} onClick={() => bannerUrl && setIsLightboxOpen(true)}>
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt="banner"
                width={800}
                height={200}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              /* Gradient fallback — shifts subtly with avatar color */
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#0d0d0d] to-[#0a0a0a]" />
                {profile.image && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.15] scale-110 blur-3xl"
                    style={{
                      backgroundImage: `url(${profile.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}
                {/* Subtle grid overlay */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505]" />
              </div>
            )}
          </div>

          <div className="px-6 md:px-10 pb-10">
            {/* Avatar & Top Info */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 md:-mt-16 mb-6">
              <div className="relative inline-block cursor-pointer group" onClick={() => profile.image && setIsAvatarLightboxOpen(true)}>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-8 ring-[#050505] bg-zinc-800 overflow-hidden shadow-2xl relative z-10 transition-transform group-hover:scale-105 duration-200">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name || ""}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 text-white text-4xl font-bold">
                      {profile.name?.charAt(0).toUpperCase() ?? "U"}
                    </div>
                  )}
                </div>
                {profile.image && (
                  <div className="absolute inset-0 rounded-full bg-black/40 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ring-8 ring-transparent">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {isOwner ? (
                  <Link href="/profile">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t('userProfile.edit')}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleLike}
                    disabled={likeLoadingState}
                    size="icon"
                    variant={liked ? "default" : "outline"}
                    className={cn("w-10 h-10 rounded-xl", liked ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-white/5 border-white/10 hover:bg-white/10 text-white")}
                  >
                    {likeLoadingState ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                    )}
                  </Button>
                )}

                <a
                  href={`https://discord.com/users/${profile.discordId || profile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-10 h-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white flex items-center justify-center"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 127.14 96.36"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5A51.31,51.31,0,0,0,30,78.82a74.37,74.37,0,0,0,67.13,0,51.31,51.31,0,0,0,1.87,1.67,68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,48.24,123.6,25.43,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.88,46,53.88,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.12,46,96.12,53,91,65.69,84.69,65.69Z" />
                    </svg>
                  </Button>
                </a>
              </div>
            </div>

            {/* Profile Identifiers */}
            <div className="mb-8 flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {profile.displayName || profile.name || "User"}
                </h1>
                <UserBadges user={profile} />
              </div>
              <p className="text-sm text-zinc-500">
                @{profile.name || "user"}
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* About Section */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white mb-3">{t('userProfile.about')}</h2>
                  {profile.about ? (
                    <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{profile.about}</p>
                  ) : (
                    <p className="text-zinc-600 text-sm italic">{t('userProfile.noAbout')}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="bg-[#050505] p-4 flex gap-4 items-start">
                    <Briefcase className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">{t('userProfile.occupation')}</div>
                      <div className="text-sm text-zinc-400">{profile.occupation || <span className="italic opacity-50">{t('userProfile.unspecified')}</span>}</div>
                    </div>
                  </div>
                  <div className="bg-[#050505] p-4 flex gap-4 items-start">
                    <Users className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">{t('userProfile.gender')}</div>
                      <div className="text-sm text-zinc-400">
                        {profile.gender ? t(`profile.editForm.genderOptions.${profile.gender}` as any) : <span className="italic opacity-50">{t('userProfile.unspecified')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#050505] p-4 flex gap-4 items-start">
                    <MapPin className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">{t('userProfile.location')}</div>
                      <div className="text-sm text-zinc-400">{profile.location || <span className="italic opacity-50">{t('userProfile.unspecified')}</span>}</div>
                    </div>
                  </div>
                  <div className="bg-[#050505] p-4 flex gap-4 items-start">
                    <Cake className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">{t('userProfile.birthday')}</div>
                      <div className="text-sm text-zinc-400">{fmtDate(profile.birthday) || <span className="italic opacity-50">{t('userProfile.unspecified')}</span>}</div>
                    </div>
                  </div>
                  <div className="bg-[#050505] p-4 flex gap-4 items-start">
                    <Eye className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">{t('userProfile.views')}</div>
                      <div className="text-sm text-zinc-400">{profile.profileViews.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="bg-[#050505] p-4 flex gap-4 items-start">
                    <Heart className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">{t('userProfile.likes')}</div>
                      <div className="text-sm text-zinc-400">{likeCount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="secondary" className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 text-xs font-bold h-8">
                      {t('userProfile.servers')}
                    </Button>
                  </div>
                  
                  {profile.ownedServers && profile.ownedServers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {profile.ownedServers.map((srv) => (
                        <Link key={srv.id} href={`/servers/${srv.id}`}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-brand-500/20 transition-all group backdrop-blur-sm">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0">
                            {srv.icon ? (
                              <DiscordIcon iconUrl={srv.icon} name={srv.name} cdnSize={64} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                                {srv.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors truncate">{srv.name}</p>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                                <Users className="w-3 h-3" /> {srv.memberCount.toLocaleString()} {t('userProfile.members')}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-brand-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center backdrop-blur-sm">
                      <p className="text-zinc-500 text-sm">{t('userProfile.noServers')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Section */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-white mb-2">{t('userProfile.social')}</h2>
                
                {Array.isArray(profile.socialLinks) && profile.socialLinks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {profile.socialLinks.map((url, i) => {
                      const { title, icon: Icon, displayUrl } = getSocialLinkInfo(url);
                      return (
                        <button key={i} onClick={() => setExternalLink(url)}
                          className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] backdrop-blur-sm transition-colors group">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                              <Icon className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">{title}</div>
                              <div className="text-xs text-zinc-500 truncate max-w-[150px]">{displayUrl}</div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-brand-400 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center backdrop-blur-sm">
                        <span className="text-zinc-600 text-sm">{t('userProfile.noSocial')}</span>
                    </div>
                )}
              </div>
            </div>
            
            {/* External Link Modal */}
            <Dialog open={!!externalLink} onOpenChange={(open) => !open && setExternalLink(null)}>
              <DialogContent className="bg-[#0c0c0e] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 mx-auto">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <DialogTitle className="text-center text-xl">{t('userProfile.externalLinkTitle')}</DialogTitle>
                  <DialogDescription className="text-center text-zinc-400">
                    {t('userProfile.externalLinkDesc')}
                  </DialogDescription>
                  <div className="mt-4 p-3 bg-black/50 border border-white/5 rounded-xl break-all text-sm text-zinc-300 text-center font-mono">
                    {externalLink}
                  </div>
                </DialogHeader>
                <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setExternalLink(null)} className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white">
                    {t('userProfile.cancel')}
                  </Button>
                  <a 
                    href={externalLink || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => {
                      setTimeout(() => setExternalLink(null), 100);
                    }} 
                    className="w-full"
                  >
                    <Button className="w-full bg-brand-500 hover:bg-brand-600 text-white">
                      {t('userProfile.continue')}
                    </Button>
                  </a>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Banner Lightbox Modal */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
              <DialogContent className="max-w-5xl bg-black/95 border border-white/10 p-0 text-white overflow-hidden sm:rounded-2xl relative">
                {bannerUrl && (
                  <div className="relative w-full aspect-[3.5/1] sm:aspect-[4/1] max-h-[70vh] flex items-center justify-center bg-black">
                    <Image
                      src={bannerUrl}
                      alt="banner lightbox"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                {isOwner && bannerUrl && (
                  <div className="absolute top-4 right-12 z-50 flex items-center gap-2">
                    <a
                      href={`/api/download/banner/${userId}`}
                      download
                      className="flex"
                    >
                      <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-brand-600/20">
                        <Download className="w-4 h-4" />
                        {t('common.download')}
                      </Button>
                    </a>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Avatar Lightbox Modal */}
            <Dialog open={isAvatarLightboxOpen} onOpenChange={setIsAvatarLightboxOpen}>
              <DialogContent className="max-w-md bg-black/95 border border-white/10 p-0 text-white overflow-hidden sm:rounded-2xl relative">
                {profile.image && (
                  <div className="relative w-full aspect-square max-h-[70vh] flex items-center justify-center bg-black">
                    <Image
                      src={profile.image}
                      alt="avatar lightbox"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                {isOwner && profile.image && (
                  <div className="absolute top-4 right-12 z-50 flex items-center gap-2">
                    <a
                      href={`/api/download/avatar/${userId}`}
                      download
                      className="flex"
                    >
                      <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-brand-600/20">
                        <Download className="w-4 h-4" />
                        {t('common.download')}
                      </Button>
                    </a>
                  </div>
                )}
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </div>
    </div>
  );
}
