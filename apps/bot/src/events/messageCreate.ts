import { Events } from 'discord.js';
import { Event } from '../structures/event';
import { incrementMessageCount } from '../utils/message-counter';

export default new Event({
    name: Events.MessageCreate,
    execute: async (client, message) => {
        if (!message.guild || message.author.bot) return;
        incrementMessageCount(message.guild.id);
    },
});
