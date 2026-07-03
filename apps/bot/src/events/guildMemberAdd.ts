import { Events, TextChannel, EmbedBuilder, MessageFlags } from 'discord.js';
import { withDiscordCircuitBreaker } from '../utils/circuit-breaker';
import { Event } from '../structures/event';
import { createLogger } from '../utils/logger';
import { eventThrottle } from '../utils/event-throttle';
import { counterBatcher } from '../utils/counter-batcher';

const logger = createLogger('guildMemberAdd');

// In-memory welcome config cache (keyed by guildId)
const welcomeConfigCache = new Map<string, { channelId: string; message: string }>();

export function setWelcomeConfig(guildId: string, channelId: string, message: string) {
    welcomeConfigCache.set(guildId, { channelId, message });
}

export function getWelcomeConfig(guildId: string) {
    return welcomeConfigCache.get(guildId) || null;
}

export function clearWelcomeConfig(guildId: string) {
    welcomeConfigCache.delete(guildId);
}

const DEFAULT_WELCOME_MESSAGE = 'Hoş geldin {user}! Sunucumuza katıldığın için çok mutluyuz. 🎉\nWelcome {user}! We are happy to have you on our server. 🎉';

function replacePlaceholders(options: { text: string; userTag: string; guildName: string; memberCount: number }): string {
    const { text, userTag, guildName, memberCount } = options;
    return text
        .replace(/\{user\}/g, userTag)
        .replace(/\{server\}/g, guildName)
        .replace(/\{count\}/g, memberCount.toLocaleString());
}

export default new Event({
    name: Events.GuildMemberAdd,
    execute: async (client, member) => {
        // Counter batching
        if (eventThrottle.shouldProcess(member.guild.id, 'memberAdd')) {
            try {
                counterBatcher.add({
                    serverId: member.guild.id,
                    memberCount: member.guild.memberCount,
                });
                logger.debug({ guildId: member.guild.id, memberCount: member.guild.memberCount }, 'Member count queued');
            } catch (error) {
                logger.error({ err: error, guildId: member.guild.id }, 'Failed to queue member count');
            }
        }

        // Welcome message
        const config = welcomeConfigCache.get(member.guild.id);
        const channelId = config?.channelId || process.env.WELCOME_CHANNEL_ID;
        if (!channelId) return;

        try {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel || !(channel instanceof TextChannel)) return;

            if (!channel.permissionsFor(member.guild.members.me!)?.has('SendMessages')) return;

            const message = config?.message || process.env.WELCOME_MESSAGE || DEFAULT_WELCOME_MESSAGE;
            const replacedMsg = replacePlaceholders({
                text: message,
                userTag: member.user.toString(),
                guildName: member.guild.name,
                memberCount: member.guild.memberCount,
            });

            const content = `### 👋 ${member.user.tag}\n\n${replacedMsg}\n\n*Seninle birlikte ${member.guild.memberCount.toLocaleString()} kişiyiz!*`;

            let errContainer;
            try {
                const { ContainerBuilder } = require('discord.js');
                errContainer = new ContainerBuilder();
                errContainer.addTextDisplayComponents((text: any) =>
                    text.setContent(content),
                );
            } catch {}

            if (errContainer) {
                await withDiscordCircuitBreaker(() => channel.send({
                    content: '',
                    embeds: [],
                    components: [errContainer],
                    flags: MessageFlags.IsComponentsV2,
                } as any));
            } else {
                await withDiscordCircuitBreaker(() => channel.send({ content }));
            }
            logger.info({ guildId: member.guild.id, userId: member.id }, 'Welcome message sent');
        } catch (error) {
            logger.error({ err: error, guildId: member.guild.id }, 'Failed to send welcome message');
        }
    },
});
