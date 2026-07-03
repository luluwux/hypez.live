import { createLogger } from '../utils/logger';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';

const logger = createLogger('webhook');

const WEBHOOK_URL = process.env.LOG_WEBHOOK_URL || '';

interface WebhookLogPayload {
    title: string;
    description: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    level?: 'info' | 'warn' | 'error';
}

const LEVEL_COLORS: Record<string, number> = {
    info: 0x3b82f6,
    warn: 0xf59e0b,
    error: 0xef4444,
};

export async function sendWebhookLog(payload: WebhookLogPayload): Promise<void> {
    if (!WEBHOOK_URL) return;

    const color = payload.color ?? LEVEL_COLORS[payload.level ?? 'info'] ?? 0x3b82f6;

    try {
        const body = {
            embeds: [{
                title: payload.title,
                description: payload.description,
                color,
                fields: payload.fields || [],
                timestamp: new Date().toISOString(),
                footer: { text: 'Hypez Bot · Webhook Logger' },
            }],
        };

        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            logger.warn({ status: res.status }, 'Webhook send failed');
        }
    } catch (err) {
        logger.error({ err }, 'Webhook send error');
    }
}

// Convenience helpers
export function logGuildJoin(guild: { name: string; id: string; memberCount: number }) {
    return sendWebhookLog({
        title: '📥 Sunucuya Eklendi',
        description: `Bot **${guild.name}** sunucusuna eklendi.`,
        color: 0x10b981,
        level: 'info',
        fields: [
            { name: 'Sunucu ID', value: guild.id, inline: true },
            { name: 'Üye Sayısı', value: guild.memberCount.toLocaleString(), inline: true },
        ],
    });
}

export function logGuildRemove(guild: { name: string; id: string; memberCount: number }) {
    return sendWebhookLog({
        title: '📤 Sunucudan Çıkarıldı',
        description: `Bot **${guild.name}** sunucusundan çıkarıldı.`,
        color: 0xef4444,
        level: 'warn',
        fields: [
            { name: 'Sunucu ID', value: guild.id, inline: true },
            { name: 'Üye Sayısı', value: guild.memberCount.toLocaleString(), inline: true },
        ],
    });
}

export function logError(module: string, error: unknown, context?: Record<string, string>) {
    const fields = [
        { name: 'Modül', value: module, inline: true },
        { name: 'Hata', value: (error instanceof Error ? error.message : String(error)).slice(0, 1024), inline: false },
    ];
    if (context) {
        for (const [key, value] of Object.entries(context)) {
            fields.push({ name: key, value: value.slice(0, 1024), inline: true });
        }
    }
    return sendWebhookLog({
        title: '❌ Bot Hatası',
        description: `**${module}** modülünde bir hata oluştu.`,
        color: 0xef4444,
        level: 'error',
        fields,
    });
}

export async function logGuildJoinChannel(client: Client, guild: { name: string; id: string; memberCount: number; ownerId: string }) {
    try {
        const logChannelId = '1515298594339422248';
        const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle('📥 Sunucuya Alındı')
                .setDescription(`Bot **${guild.name}** sunucusuna başarıyla eklendi.`)
                .setColor(0x10b981) // Green
                .addFields(
                    { name: 'Sunucu Adı', value: guild.name, inline: true },
                    { name: 'Sunucu ID', value: guild.id, inline: true },
                    { name: 'Üye Sayısı', value: guild.memberCount.toLocaleString(), inline: true },
                    { name: 'Sahip ID', value: guild.ownerId, inline: true }
                )
                .setTimestamp();
            
            await (logChannel as TextChannel).send({ embeds: [embed] }).catch(console.error);
        }
    } catch (err) {
        logger.error({ err }, 'Failed to send guild join log to channel');
    }
}

export async function logGuildLeaveChannel(client: Client, guild: { name: string; id: string; memberCount: number }) {
    try {
        const logChannelId = '1515298594339422248';
        const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle('📤 Sunucudan Atıldı')
                .setDescription(`Bot **${guild.name}** sunucusundan çıkarıldı.`)
                .setColor(0xef4444) // Red
                .addFields(
                    { name: 'Sunucu Adı', value: guild.name, inline: true },
                    { name: 'Sunucu ID', value: guild.id, inline: true },
                    { name: 'Üye Sayısı', value: guild.memberCount.toLocaleString(), inline: true }
                )
                .setTimestamp();

            await (logChannel as TextChannel).send({ embeds: [embed] }).catch(console.error);
        }
    } catch (err) {
        logger.error({ err }, 'Failed to send guild leave log to channel');
    }
}
