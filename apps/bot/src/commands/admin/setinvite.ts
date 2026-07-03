import {
    PermissionFlagsBits,
    ContainerBuilder,
    MessageFlags,
    TextChannel,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
    Guild,
    GuildBasedChannel,
} from 'discord.js';
import { Command } from '../../structures/command';
import { apiClient } from '../../utils/api-client';
import { getLocale, t } from '../../utils/i18n';

const DISCORD_INVITE_REGEX = /^(https?:\/\/)?discord\.(gg|com\/invite)\/([a-zA-Z0-9-]{2,32})\/?$/;
const WEB_URL = process.env.WEB_URL || 'https://hypez.live';

async function createPermanentInvite(guild: Guild): Promise<string | null> {
    const botMember = guild.members.me;
    const channel = guild.channels.cache.find(
        (c: GuildBasedChannel) =>
            (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) &&
            botMember && botMember.permissionsIn(c).has(PermissionFlagsBits.CreateInstantInvite)
    ) as TextChannel | undefined;

    if (!channel) return null;

    const invite = await (channel as TextChannel).createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: false,
        reason: 'Hypez server listing — permanent invite via /setinvite',
    });

    return `https://discord.gg/${invite.code}`;
}

export default new Command({
    name: 'setinvite',
    description: 'Sunucu davet linkini ayarlar veya otomatik oluşturur',
    category: 'admin',
    options: [
        {
            name: 'link',
            description: 'Davet linki (örn. discord.gg/kodunuz). Boş bırakırsanız otomatik oluşturulur.',
            type: 3, // STRING
            required: false,
        },
    ],
    execute: async (client, interaction) => {
        const locale = await getLocale(client, interaction.guildId!);

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: t('settings.permission.denied', locale),
                flags: [MessageFlags.Ephemeral],
            });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const guildId = interaction.guildId;
        const guild = interaction.guild;

        if (!guildId || !guild) {
            const userLocale = interaction.locale.startsWith('tr') ? 'tr' : 'en';
            return interaction.editReply({ content: t('common.not_in_guild', userLocale) });
        }

        const server = await client.prisma.server.findUnique({
            where: { id: guildId },
            select: { inviteUrl: true, name: true },
        });

        if (!server) {
            return interaction.editReply(t('common.server_not_registered', locale));
        }

        const rawLink = interaction.options.getString('link');

        // Auto-generate if no link provided
        if (!rawLink) {
            const inviteUrl = await createPermanentInvite(guild);

            if (!inviteUrl) {
                return interaction.editReply(t('setinvite.no_channel', locale));
            }

            await apiClient.updateServer(guildId, { inviteUrl });

            const container = new ContainerBuilder();

            container.addTextDisplayComponents((text: any) =>
                text.setContent(
                    `# ${t('setinvite.created.title', locale)}\n` +
                    t('setinvite.body', locale, {
                        serverName: server.name,
                        inviteUrl,
                        webUrl: WEB_URL,
                        guildId,
                    })
                )
            );

            container.addActionRowComponents((row: any) =>
                row.setComponents(
                    new ButtonBuilder()
                        .setURL(inviteUrl)
                        .setLabel(t('setinvite.open_discord', locale))
                        .setStyle(ButtonStyle.Link)
                        .setEmoji('🔗'),
                    new ButtonBuilder()
                        .setURL(`${WEB_URL}/servers/${guildId}`)
                        .setLabel(t('setinvite.view_server', locale))
                        .setStyle(ButtonStyle.Link)
                        .setEmoji('🌐')
                )
            );

            return interaction.editReply({
                content: '',
                embeds: [],
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            } as any);
        }

        // Validate provided link
        if (!DISCORD_INVITE_REGEX.test(rawLink)) {
            return interaction.editReply(t('setinvite.invalid_format', locale));
        }

        const inviteUrl = rawLink.startsWith('http') ? rawLink : `https://${rawLink}`;

        await apiClient.updateServer(guildId, { inviteUrl });

        const container = new ContainerBuilder();

        container.addTextDisplayComponents((text: any) =>
            text.setContent(
                `# ${t('setinvite.updated.title', locale)}\n` +
                t('setinvite.body', locale, {
                    serverName: server.name,
                    inviteUrl,
                    webUrl: WEB_URL,
                    guildId,
                })
            )
        );

        container.addActionRowComponents((row: any) =>
            row.setComponents(
                new ButtonBuilder()
                    .setURL(inviteUrl)
                    .setLabel(t('setinvite.open_discord', locale))
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🔗'),
                new ButtonBuilder()
                    .setURL(`${WEB_URL}/servers/${guildId}`)
                    .setLabel(t('setinvite.view_server', locale))
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🌐')
            )
        );

        return interaction.editReply({
            content: '',
            embeds: [],
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        } as any);
    },
});
