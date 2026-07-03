import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../structures/command';
import { handleVoteFlow } from '../../handlers/vote.handler';

export default new Command({
    name: 'vote',
    description: 'Vote for this server',
    category: 'public',
    execute: async (client, interaction) => {
        // Use the shared handler for consistent logic
        await handleVoteFlow(client, interaction);
    },
});
