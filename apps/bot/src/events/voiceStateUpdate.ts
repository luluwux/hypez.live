import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { createLogger } from '../utils/logger';
import { eventThrottle } from '../utils/event-throttle';
import { counterBatcher } from '../utils/counter-batcher';

const logger = createLogger('voiceStateUpdate');

export default new Event({
    name: Events.VoiceStateUpdate,
    execute: async (client, oldState, newState) => {
        const guild = newState.guild || oldState.guild;
        if (!guild) return;

        // Throttle: max 1 update per guild per 60s
        if (!eventThrottle.shouldProcess(guild.id, 'voiceUpdate')) {
            logger.debug({ guildId: guild.id }, 'Event throttled');
            return;
        }

        try {
            const voiceStates = guild.voiceStates.cache;
            counterBatcher.add({
                serverId: guild.id,
                voiceMemberCount: voiceStates.size,
                streamingMemberCount: voiceStates.filter((vs) => !!vs.streaming).size,
                videoMemberCount: voiceStates.filter((vs) => !!vs.selfVideo).size,
                normalVoiceMemberCount: voiceStates.filter((vs) => !vs.streaming && !vs.selfVideo).size,
            });

            logger.debug({ guildId: guild.id }, 'Voice stats queued');
        } catch (error) {
            logger.error({ err: error, guildId: guild.id }, 'Failed to queue voice stats');
        }
    },
});
