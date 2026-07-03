import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { apiClient } from '../utils/api-client';
import { logGuildRemove, logGuildLeaveChannel } from '../services/webhook-logger';

export default new Event({
    name: Events.GuildDelete,
    execute: async (client, guild) => {
        console.log(`[GuildDelete] Left guild: ${guild.name} (${guild.id})`);

        // Webhook notification
        logGuildRemove({
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount,
        });

        // Channel notification
        await logGuildLeaveChannel(client, {
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount,
        });

        try {
            await apiClient.deleteServer(guild.id);
            console.log(`[GuildDelete] Removed guild ${guild.name} via API.`);
        } catch (error) {
            console.error(`[GuildDelete] Failed to remove guild ${guild.name}:`, error);
        }
    },
});
