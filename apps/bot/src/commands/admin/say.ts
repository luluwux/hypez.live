import {
    PermissionsBitField,
    ChatInputCommandInteraction,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import { Command } from '../../structures/command';
import { HypezClient } from '../../structures/client';
import { getLocale, t } from '../../utils/i18n';

export default new Command({
    name: 'say',
    description: 'Shows server statistics (Total Members, Active, Votes, Boosts)',
    category: 'admin',
    options: [],
    execute: async (client: HypezClient, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            const userLocale = interaction.locale.startsWith('tr') ? 'tr' : 'en';
            return interaction.reply({ content: t('common.not_in_guild', userLocale), flags: [MessageFlags.Ephemeral] });
        }

        const guildId = interaction.guild.id;
        const guild = interaction.guild;
        const locale = await getLocale(client, guildId);

        // Gate: Administrator permission required
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: t('common.admin_only', locale),
                flags: [MessageFlags.Ephemeral],
            });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            // Fetch server votes from database
            const server = await client.prisma.server.findUnique({
                where: { id: guildId },
                select: { votes: true },
            });

            if (!server) {
                return interaction.editReply(t('common.server_not_registered', locale));
            }

            // Calculate active members from presence status
            const activeCount = guild.members.cache.filter(m =>
                m.presence?.status !== 'offline' && m.presence?.status !== undefined
            ).size;

            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# ${t('say.stats.title', locale, { serverName: guild.name })}\n\n` +
                    `👥 **${t('say.stats.members', locale)}:** ${guild.memberCount.toLocaleString()}\n` +
                    `🟢 **${t('say.stats.active', locale)}:** ${activeCount.toLocaleString()}\n` +
                    `🗳️ **${t('say.stats.votes', locale)}:** ${server.votes.toLocaleString()}\n` +
                    `✨ **${t('say.stats.boosts', locale)}:** ${(guild.premiumSubscriptionCount ?? 0).toLocaleString()}`
                )
            );

            await interaction.editReply({
                content: '',
                embeds: [],
                components: [container],
                files: [],
                flags: MessageFlags.IsComponentsV2,
            } as any);

        } catch (error) {
            console.error('[SayStats] Error:', error);
            await interaction.editReply(t('say.failed', locale));
        }
    },
});
