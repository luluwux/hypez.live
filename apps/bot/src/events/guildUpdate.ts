import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { apiClient } from '../utils/api-client';

export default new Event({
    name: Events.GuildUpdate,
    execute: async (client, oldGuild, newGuild) => {
        console.log(`[GuildUpdate] Guild updated: ${newGuild.name} (${newGuild.id})`);

        const MAX_RETRIES = 3;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                // Read current version for optimistic locking
                const current = await client.prisma.server.findUnique({
                    where: { id: newGuild.id },
                    select: { version: true },
                });

                const banner = newGuild.bannerURL({ size: 1024, extension: 'webp' });

                const result = await apiClient.updateServer(newGuild.id, {
                    name: newGuild.name,
                    icon: newGuild.iconURL() || '',
                    banner: banner || null,
                    description: newGuild.description || null,
                    ownerId: newGuild.ownerId,
                    boostCount: newGuild.premiumSubscriptionCount || 0,
                    version: current?.version ?? 0,
                });

                // If versioned update failed due to stale version, retry
                if (result && (result as { stale?: boolean }).stale) {
                    console.warn(`[GuildUpdate] Stale version for ${newGuild.id}, retrying (${attempt + 1}/${MAX_RETRIES})...`);
                    continue;
                }

                console.log(`[GuildUpdate] Updated guild ${newGuild.name} via API.`);
                return;
            } catch (error) {
                if (attempt < MAX_RETRIES - 1) {
                    console.warn(`[GuildUpdate] Error for ${newGuild.name}, retrying (${attempt + 1}/${MAX_RETRIES}):`, error);
                } else {
                    console.error(`[GuildUpdate] Failed to update guild ${newGuild.name} after ${MAX_RETRIES} attempts:`, error);
                }
            }
        }
    },
});
