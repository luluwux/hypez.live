"use client";

import Image from "next/image";

interface DiscordIconProps {
    iconUrl: string;
    name: string;
    cdnSize: 64 | 128 | 256;
    fill?: boolean;
    width?: number;
    height?: number;
    className?: string;
    sizes?: string;
    priority?: boolean;
}

function getDiscordIconBase(iconUrl: string): string {
    return iconUrl
        .replace(/\.(png|gif|webp|jpg|jpeg)/i, "")
        .replace(/\?.*$/, "");
}

function isAnimatedDiscordIcon(iconUrl: string): boolean {
    const isDiscordUrl =
        iconUrl.includes("discordapp") || iconUrl.includes("discord.com");
    if (!isDiscordUrl) return false;
    return (iconUrl.split("?")[0] ?? "").includes("/a_");
}

export function DiscordIcon({
    iconUrl,
    name,
    cdnSize,
    fill,
    width,
    height,
    className = "",
    sizes,
    priority,
}: DiscordIconProps) {
    const isDiscordUrl =
        iconUrl.includes("discordapp") || iconUrl.includes("discord.com");

    if (!isDiscordUrl) {
        if (fill) {
            return (
                <Image
                    src={iconUrl}
                    alt={name}
                    fill
                    className={className}
                    sizes={sizes}
                    priority={priority}
                />
            );
        }
        return (
            <Image
                src={iconUrl}
                alt={name}
                width={width ?? cdnSize}
                height={height ?? cdnSize}
                className={className}
                priority={priority}
            />
        );
    }

    const base = getDiscordIconBase(iconUrl);
    const animated = isAnimatedDiscordIcon(iconUrl);

    if (animated) {
        const src = `${base}.gif?size=${cdnSize}`;
        if (fill) {
            return (
                <Image
                    src={src}
                    alt={name}
                    fill
                    unoptimized
                    className={className}
                    sizes={sizes}
                    priority={priority}
                />
            );
        }
        return (
            <Image
                src={src}
                alt={name}
                width={width ?? cdnSize}
                height={height ?? cdnSize}
                unoptimized
                className={className}
                priority={priority}
            />
        );
    }

    const src = `${base}?size=${cdnSize}`;

    if (fill) {
        return (
            <Image
                src={src}
                alt={name}
                fill
                className={className}
                sizes={sizes}
                priority={priority}
            />
        );
    }

    return (
        <Image
            src={src}
            alt={name}
            width={width ?? cdnSize}
            height={height ?? cdnSize}
            className={className}
            priority={priority}
        />
    );
}
