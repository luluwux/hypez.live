import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { createLogger } from '../utils/logger';
import { eventThrottle } from '../utils/event-throttle';
import { counterBatcher } from '../utils/counter-batcher';

const logger = createLogger('guildMemberRemove');

export default new Event({
    name: Events.GuildMemberRemove,
    execute: async (client, member) => {
        if (!eventThrottle.shouldProcess(member.guild.id, 'memberRemove')) {
            logger.debug({ guildId: member.guild.id }, 'Event throttled');
            return;
        }

        try {
            counterBatcher.add({
                serverId: member.guild.id,
                memberCount: member.guild.memberCount,
            });

            logger.debug({ guildId: member.guild.id, memberCount: member.guild.memberCount }, 'Member count queued');
        } catch (error) {
            logger.error({ err: error, guildId: member.guild.id }, 'Failed to queue member count');
        }
    },
});
