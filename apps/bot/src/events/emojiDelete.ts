import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { apiClient } from '../utils/api-client';

export default new Event({
    name: Events.GuildEmojiDelete,
    execute: async (client, emoji) => {
        try {
            // Full re-sync from cache to ensure consistency
            const emojis = emoji.guild.emojis.cache.map((e) => ({
                emojiId: e.id,
                name: e.name || 'Unknown',
                url: e.url,
                animated: e.animated || false,
            }));

            await apiClient.syncEmojis(emoji.guild.id, emojis);
        } catch (error) {
            console.error(`[EmojiDelete] Failed to sync emojis for ${emoji.guild.name}:`, error);
        }
    },
});
