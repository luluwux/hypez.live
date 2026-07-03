import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { apiClient } from '../utils/api-client';

export default new Event({
    name: Events.GuildEmojiUpdate,
    execute: async (client, oldEmoji, newEmoji) => {
        try {
            // Full re-sync from cache to ensure consistency
            const emojis = newEmoji.guild.emojis.cache.map((e) => ({
                emojiId: e.id,
                name: e.name || 'Unknown',
                url: e.url,
                animated: e.animated || false,
            }));

            await apiClient.syncEmojis(newEmoji.guild.id, emojis);
        } catch (error) {
            console.error(`[EmojiUpdate] Failed to sync emojis for ${newEmoji.guild.name}:`, error);
        }
    },
});
