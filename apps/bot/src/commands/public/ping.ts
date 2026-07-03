import {
    ChatInputCommandInteraction,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import { Command } from '../../structures/command';
import { getLocale, t } from '../../utils/i18n';

export default new Command({
    name: 'ping',
    description: 'Replies with the bot latency and Discord API latency',
    category: 'public',
    execute: async (client, interaction) => {
        const locale = interaction.guildId ? await getLocale(client, interaction.guildId) : 'en';
        
        // Defer reply first since we will edit it with Container V2 format
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const latency = Date.now() - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        const content = t('ping.response', locale, { latency, apiLatency });

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content)
        );

        await interaction.editReply({
            content: '',
            embeds: [],
            components: [container],
            files: [],
            flags: MessageFlags.IsComponentsV2,
        } as any);
    },
});
