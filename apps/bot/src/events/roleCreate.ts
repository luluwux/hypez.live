import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { counterBatcher } from '../utils/counter-batcher';

export default new Event({
    name: Events.GuildRoleCreate,
    execute: async (client, role) => {
        try {
            counterBatcher.add({
                serverId: role.guild.id,
                roleCount: role.guild.roles.cache.size,
            });
        } catch (error) {
            console.error(`[RoleCreate] Failed to queue role count for ${role.guild.name}:`, error);
        }
    },
});
