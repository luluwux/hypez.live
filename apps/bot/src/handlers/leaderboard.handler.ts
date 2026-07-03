/**
 * leaderboard.handler.ts
 *
 * Oy sonrası Discord leaderboard mesajını günceller.
 *
 * Güncelleme stratejisi (yüksek trafik için):
 *   1. Her oy'da → TEXT-ONLY update: mevcut attachment'lar (PNG banner) korunur,
 *      sadece metin içeriği değişir. Disk I/O ve canvas render yok.
 *   2. 5 dakika debounce → FULL update: banner diskten yüklenir, Discord'a yeniden gönderilir.
 *      Bu sayede 100 oy gelse de sadece 1 full update tetiklenir.
 *
 * WHY bu tasarım:
 *   - Canvas render CPU-yoğundur, her oy'da çalıştırmak sistemi kilitler.
 *   - Discord mesaj edit rate limit: 5/saniye/kanal. Text-only editler çok daha hafif.
 *   - Banner sabittir; oy sayısı metinde gösterilir.
 */

import {
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    ThumbnailBuilder,
    MessageFlags,
    TextChannel,
} from 'discord.js';
import type { Message } from 'discord.js';
import { HypezClient } from '../structures/client';
import { leaderboardQueue } from '../utils/queue';
import { t } from '../utils/i18n';

const WEB_URL = process.env.WEB_URL || 'https://hypez.live';


/**
 * Oy sonrasında çağrılır.
 * BullMQ ile worker'a görev ekler. (jobId deduplication sağlar)
 */
export async function updateLeaderboard(client: HypezClient, guildId: string): Promise<void> {
    // 1. Hızlı metin güncellemesi (5sn debounce)
    await leaderboardQueue.add('update', { guildId }, {
        jobId: `leaderboard:text:${guildId}`,
        removeOnComplete: true,
        removeOnFail: true,
        delay: 5000 
    });

    // 2. Tam (banner) güncelleme (5dk debounce)
    await leaderboardQueue.add('full-update', { guildId }, {
        jobId: `leaderboard:full:${guildId}`,
        removeOnComplete: true,
        removeOnFail: true,
        delay: 5 * 60 * 1000
    });
}

/**
 * Worker tarafından çalıştırılan asıl iş fonksiyonu.
 */
export async function updateLeaderboardJob(client: HypezClient, guildId: string): Promise<void> {
    const server = await client.prisma.server.findUnique({
        where: { id: guildId },
        select: {
            name: true,
            votes: true,
            weeklyHypeScore: true,
            leaderboardChannelId: true,
            leaderboardMessageId: true,
            locale: true,
        },
    });

    if (!server?.leaderboardChannelId || !server.leaderboardMessageId) return;

    let message: Message;
    try {
        const channel = await client.channels.fetch(server.leaderboardChannelId) as TextChannel | null;
        if (!channel) return;
        const fetched = await channel.messages.fetch(server.leaderboardMessageId);
        if (!fetched) return;
        message = fetched;
    } catch {
        return;
    }

    const { rank } = await fetchLeaderboardData({
        client, votes: server.votes,
    });

    const textContainer = buildContainer({
        serverName: server.name,
        votes: server.votes,
        weeklyHypeScore: server.weeklyHypeScore,
        rank,
        guildId,
        locale: server.locale || 'en',
    });

    try {
        await message.edit({
            content: '',
            embeds: [],
            components: [textContainer],
            files: [],
            attachments: [],
            flags: MessageFlags.IsComponentsV2,
        } as any);
    } catch (err) {
        console.error(`[Leaderboard] Text update hatası guild=${guildId}:`, err);
        return;
    }

    console.log(`[Leaderboard] Text güncellendi: guild=${guildId} votes=${server.votes} rank=${rank}`);
}


export async function runFullUpdateJob(
    client: HypezClient,
    guildId: string,
): Promise<void> {
    const server = await client.prisma.server.findUnique({
        where: { id: guildId },
        select: {
            name: true,
            votes: true,
            weeklyHypeScore: true,
            locale: true,
            leaderboardChannelId: true,
            leaderboardMessageId: true,
        },
    });

    if (!server?.leaderboardChannelId || !server.leaderboardMessageId) return;

    let message: Message;
    try {
        const channel = await client.channels.fetch(server.leaderboardChannelId) as TextChannel | null;
        if (!channel) return;
        const fetched = await channel.messages.fetch(server.leaderboardMessageId);
        if (!fetched) return;
        message = fetched;
    } catch {
        return;
    }

    const { rank } = await fetchLeaderboardData({
        client, votes: server.votes,
    });

    const fullContainer = buildContainer({
        serverName: server.name,
        votes: server.votes,
        weeklyHypeScore: server.weeklyHypeScore,
        rank,
        guildId,
        locale: server.locale || 'en',
    });

    try {
        await message.edit({
            content: '',
            embeds: [],
            components: [fullContainer],
            files: [],
            attachments: [],
            flags: MessageFlags.IsComponentsV2,
        });
        console.log(`[Leaderboard] Full güncellendi: guild=${guildId}`);
    } catch (err) {
        console.error(`[Leaderboard] Full update hatası guild=${guildId}:`, err);
    }
}


async function resolveDiscordIds(client: HypezClient, userIds: string[]): Promise<Map<string, string>> {
    const idMap = new Map<string, string>();
    const cuids: string[] = [];

    for (const id of userIds) {
        if (/^\d+$/.test(id)) {
            idMap.set(id, id);
        } else {
            cuids.push(id);
        }
    }

    if (cuids.length > 0) {
        const accounts = await client.prisma.account.findMany({
            where: {
                userId: { in: cuids },
                provider: 'discord'
            },
            select: {
                userId: true,
                providerAccountId: true
            }
        });

        for (const acc of accounts) {
            idMap.set(acc.userId, acc.providerAccountId);
        }

        for (const id of cuids) {
            if (!idMap.has(id)) {
                idMap.set(id, id);
            }
        }
    }

    return idMap;
}

async function fetchLeaderboardData(options: {
    client: HypezClient;
    votes: number;
}) {
    const { client, votes } = options;
    const betterServers = await client.prisma.server.count({
        where: { votes: { gt: votes } },
    });
    const rank = betterServers + 1;

    return { rank };
}

function buildContainer(params: {
    serverName: string;
    votes: number;
    weeklyHypeScore: number;
    rank: number;
    guildId: string;
    locale: string;
}): ContainerBuilder {
    const { serverName, votes, weeklyHypeScore, rank, guildId, locale } = params;

    const container = new ContainerBuilder();

    const voteBtn = t('setup.board.vote_btn', locale);
    const viewBtn = t('setup.board.view_btn', locale);
    const description = t('setup.board.desc', locale)
        .replace('{votes}', votes.toLocaleString())
        .replace('{hype}', Math.round(weeklyHypeScore).toLocaleString())
        .replace('{rank}', String(rank));

    container.addSectionComponents((section: any) =>
        section
            .addTextDisplayComponents((text: any) =>
                text.setContent(`# ${serverName}\n\n${description}`)
            )
            .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(`${WEB_URL}/apple-touch-icon.png`)
            )
    );

    container.addActionRowComponents((row: any) =>
        row.setComponents(
            new ButtonBuilder()
                .setCustomId('container_vote')
                .setLabel(voteBtn)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🤍'),
            new ButtonBuilder()
                .setCustomId('container_hype')
                .setLabel('Hype')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:Hypez:1515304864148881418>'),
            new ButtonBuilder()
                .setURL(`${WEB_URL}/servers/${guildId}`)
                .setLabel(viewBtn)
                .setStyle(ButtonStyle.Link)
                .setEmoji('🔗'),
        ),
    );

    return container;
}
