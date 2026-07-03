"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, Activity, Mic, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Server } from "@/lib/api";
import { ServerBadges } from "./ServerBadges";
import { useTranslation } from "@/lib/i18n/hooks";
import { DiscordIcon } from "@/components/shared/DiscordIcon";

interface ServerHeaderProps {
    server: Server;
}

export function ServerHeader({ server }: ServerHeaderProps) {
    const inviteUrl = server.inviteUrl;
    const { t } = useTranslation();

    return (
        <div className="relative w-full min-h-[380px] md:min-h-[440px] mb-8 group">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <Image
                    src={server.banner ? (server.banner.includes("discordapp") || server.banner.includes("discord") ? `${server.banner}?size=512` : server.banner) : "/assets/DefaultBanner.png"}
                    alt={server.name}
                    fill
                    quality={85}
                    className="object-cover opacity-30 blur-sm scale-110"
                    sizes="100vw"
                    priority
                    unoptimized={server.banner ? (server.banner.includes("/a_") || server.banner.includes(".gif")) : false}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#020202] via-[#050505] to-[#080808]" />
            </div>

            {/* Content Container */}
            <div className="container relative h-full flex flex-col justify-end pb-10 px-4 md:px-6 mx-auto max-w-7xl pt-40 md:pt-48">
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    {/* Server Icon */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-zinc-800/50 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center text-4xl font-bold text-zinc-500 relative z-10 group-hover:scale-105 transition-transform duration-500">
                            {server.icon ? (
                                <DiscordIcon
                                    iconUrl={server.icon}
                                    name={server.name}
                                    cdnSize={128}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                server.name.charAt(0)
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-2">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                                {server.name}
                            </h1>
                            {/* Badges */}
                            <ServerBadges server={server} className="mt-1 md:mt-2" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-auto flex gap-3 mt-4 md:mt-0">
                        {inviteUrl ? (
                            <a
                                href={inviteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    size="lg"
                                    className="w-full md:w-auto bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl px-8 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95 border-none"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    {t('server.header.joinServer')}
                                </Button>
                            </a>
                        ) : (
                            <Button
                                size="lg"
                                disabled
                                className="w-full md:w-auto bg-zinc-800 text-zinc-500 font-bold rounded-xl px-8 border-none opacity-80 cursor-not-allowed"
                                title={t('server.header.linkNotSet')}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {t('server.header.linkNotSet')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
