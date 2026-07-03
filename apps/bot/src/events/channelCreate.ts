import { Events, ChannelType } from 'discord.js';
import { Event } from '../structures/event';
import { counterBatcher } from '../utils/counter-batcher';

function countChannels(guild: any) {
    const textChannels = guild.channels.cache.filter(
        (c: any) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildForum || c.type === ChannelType.GuildAnnouncement
    );
    const voiceChannels = guild.channels.cache.filter(
        (c: any) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
    );
    return { channelCount: textChannels.size, voiceChannelCount: voiceChannels.size };
}

export default new Event({
    name: Events.ChannelCreate,
    execute: async (client, channel) => {
        if (!channel.isDMBased() && channel.guild) {
            try {
                const { channelCount, voiceChannelCount } = countChannels(channel.guild);
                counterBatcher.add({
                    serverId: channel.guild.id,
                    channelCount,
                    voiceChannelCount,
                });
            } catch (error) {
                console.error(`[ChannelCreate] Failed to queue channel count for ${channel.guild.name}:`, error);
            }
        }
    },
});
