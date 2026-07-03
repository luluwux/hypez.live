import {
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import { Command } from '../../structures/command';
import { getLocale, t } from '../../utils/i18n';
import { apiClient } from '../../utils/api-client';

export default new Command({
    name: 'settings',
    description: 'Configure your server settings',
    category: 'admin',
    execute: async (client, interaction) => {
        const locale = await getLocale(client, interaction.guildId!);

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: t('settings.permission.denied', locale),
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const guildId = interaction.guildId!;
        const server = await client.prisma.server.findUnique({
            where: { id: guildId },
            select: { locale: true, categories: true, inviteUrl: true }
        });

        const currentLocale = server?.locale || 'en';
        const currentCategories = server?.categories || [];
        const inviteUrl = server?.inviteUrl;

        const langFlag = currentLocale === 'tr' ? '🇹🇷' : '🇬🇧';
        const langName = currentLocale === 'tr' ? 'Turkish' : 'English';

        const allCategories = await apiClient.fetchActiveCategories();

        const catNames = currentCategories.length > 0
            ? currentCategories.map((c: string) => {
                const cat = allCategories.find(x => x.id === c || x.slug === c);
                return cat ? `${cat.emoji} ${cat.name}` : `\`${c}\``;
            }).join(', ')
            : t('settings.not_selected', currentLocale);

        const content = `### ⚙️ ${t('settings.title', currentLocale)}\n` +
            `${t('settings.description', currentLocale)}\n\n` +
            `**🌍 ${t('settings.language.label', currentLocale)}:** ${langFlag} **${langName}**\n` +
            `**📂 ${t('settings.categories.label', currentLocale)}:** ${catNames}\n` +
            `**🔗 ${t('settings.invite_url.label', currentLocale)}:** ${inviteUrl ? `\`${inviteUrl}\`` : t('settings.not_set_invite', currentLocale)}\n\n` +
            `${t('settings.info', currentLocale)}`;

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('settings_language')
                .setLabel(t('settings.button.lang', currentLocale))
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🌍'),
            new ButtonBuilder()
                .setCustomId('settings_main_category')
                .setLabel(t('settings.button.cats', currentLocale))
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📂')
        );

        const container = new ContainerBuilder();
        container.addTextDisplayComponents((text: TextDisplayBuilder) =>
            text.setContent(content)
        );

        await interaction.editReply({
            content: '',
            embeds: [],
            components: [container, actionRow],
            flags: MessageFlags.IsComponentsV2,
        } as any);
    },
});
