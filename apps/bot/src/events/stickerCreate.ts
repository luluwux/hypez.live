import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { apiClient } from '../utils/api-client';

export default new Event({
    name: Events.GuildStickerCreate,
    execute: async (client, sticker) => {
        const guild = sticker.guild;
        if (!guild) return;

        try {
            const stickers = guild.stickers.cache.map((s) => ({
                stickerId: s.id,
                name: s.name,
                url: s.url,
                format: s.format.toString(),
            }));

            await apiClient.syncStickers(guild.id, stickers);
        } catch (error) {
            console.error(`[StickerCreate] Failed to sync stickers:`, error);
        }
    },
});
