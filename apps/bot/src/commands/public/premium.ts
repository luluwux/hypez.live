import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    ApplicationCommandOptionType,
    ContainerBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import { Command } from '../../structures/command';
import { HypezClient } from '../../structures/client';
import { getLocale, t } from '../../utils/i18n';

export default new Command({
    name: 'premium',
    description: 'Check premium status or redeem a premium code',
    category: 'public',
    options: [
        {
            name: 'code',
            description: 'Redeem a premium code for this server',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],
    execute: async (client: HypezClient, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            const userLocale = interaction.locale.startsWith('tr') ? 'tr' : 'en';
            return interaction.reply({ content: t('common.not_in_guild', userLocale), flags: [MessageFlags.Ephemeral] });
        }

        const code = interaction.options.getString('code')?.trim();
        const guildId = interaction.guild.id;
        const locale = await getLocale(client, guildId);

        const sendV2Result = async (content: string) => {
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
        };

        if (code) {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: locale === 'tr' 
                        ? '❌ Bu işlemi gerçekleştirmek için **Yönetici (Administrator)** yetkisine sahip olmalısınız!' 
                        : '❌ You must have **Administrator** permission to perform this action!',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            try {
                const premiumCode = await client.prisma.premiumCode.findUnique({
                    where: { code },
                });

                if (!premiumCode) {
                    return interaction.editReply({
                        content: locale === 'tr' 
                            ? '❌ Girdiğiniz premium kod geçerli değil.' 
                            : '❌ The premium code you entered is not valid.'
                    });
                }

                if (premiumCode.isUsed) {
                    return interaction.editReply({
                        content: locale === 'tr' 
                            ? '❌ Bu premium kod zaten kullanılmış.' 
                            : '❌ This premium code has already been redeemed.'
                    });
                }

                const server = await client.prisma.server.findUnique({
                    where: { id: guildId },
                });

                if (!server) {
                    return interaction.editReply({
                        content: locale === 'tr' 
                            ? '❌ Sunucu sistemde bulunamadı. Lütfen kurulumun tamamlandığından emin olun.' 
                            : '❌ Server not found in the system. Please ensure the setup is completed.'
                    });
                }

                const account = await client.prisma.account.findFirst({
                    where: { providerAccountId: interaction.user.id, provider: 'discord' },
                    select: { userId: true }
                });
                const dbUserId = account?.userId || null;

                const result = await client.prisma.$transaction(async (tx) => {
                    const codeInTx = await tx.premiumCode.findUnique({
                        where: { id: premiumCode.id },
                    });

                    if (!codeInTx || codeInTx.isUsed) {
                        throw new Error('USED');
                    }

                    const updateCode = await tx.premiumCode.updateMany({
                        where: { id: premiumCode.id, isUsed: false },
                        data: {
                            isUsed: true,
                            usedById: dbUserId,
                            usedAt: new Date(),
                            usedServerId: guildId,
                        },
                    });

                    if (updateCode.count === 0) {
                        throw new Error('USED');
                    }

                    const durationMs = premiumCode.duration * 24 * 60 * 60 * 1000;
                    const now = new Date();
                    let newExpiresAt: Date;

                    if (server.isPremium && server.premiumExpiresAt && server.premiumExpiresAt.getTime() > now.getTime()) {
                        newExpiresAt = new Date(server.premiumExpiresAt.getTime() + durationMs);
                    } else {
                        newExpiresAt = new Date(now.getTime() + durationMs);
                    }

                    await tx.server.update({
                        where: { id: guildId },
                        data: {
                            isPremium: true,
                            premiumTier: 'PREMIUM',
                            premiumExpiresAt: newExpiresAt,
                        },
                    });

                    return newExpiresAt;
                });

                const successContent = locale === 'tr'
                    ? `# 🎉 Premium Aktif Edildi!\n\n🇹🇷 **Harika!** Sunucunuz başarıyla premium yapıldı.\n📅 **Bitiş Tarihi:** <t:${Math.floor(result.getTime() / 1000)}:F>`
                    : `# 🎉 Premium Activated!\n\n🇬🇧 **Awesome!** Your server has been successfully upgraded to premium.\n📅 **Expiration Date:** <t:${Math.floor(result.getTime() / 1000)}:F>`;

                await sendV2Result(successContent);

            } catch (e: any) {
                if (e.message === 'USED') {
                    return interaction.editReply({
                        content: locale === 'tr' 
                            ? '❌ Bu premium kod başka bir işlem tarafından kullanıldı.' 
                            : '❌ This premium code was redeemed by another process.'
                    });
                }
                console.error('[Premium Redeem] Error:', e);
                return interaction.editReply({
                    content: locale === 'tr' 
                        ? '❌ Kurulum tamamlanırken bir hata oluştu!' 
                        : '❌ An error occurred while completing the setup!'
                });
            }
        } else {
            await interaction.deferReply();
            try {
                const server = await client.prisma.server.findUnique({
                    where: { id: guildId },
                    select: {
                        name: true,
                        premiumTier: true,
                        isPremium: true,
                        isToken: true,
                        premiumExpiresAt: true,
                        votes: true,
                        weeklyHypeScore: true,
                    },
                });

                if (!server) {
                    return interaction.editReply(t('common.server_not_registered', locale));
                }

                const tierLabel = server.isToken 
                    ? t('premium.tier.token', locale) 
                    : server.premiumTier === 'PREMIUM' 
                        ? t('premium.tier.premium', locale) 
                        : t('premium.tier.free', locale);

                const expiryText = server.premiumExpiresAt
                    ? `<t:${Math.floor(new Date(server.premiumExpiresAt).getTime() / 1000)}:R>`
                    : server.isPremium || server.isToken ? t('premium.permanent', locale) : 'N/A';

                let desc = '';
                if (!server.isPremium && !server.isToken) {
                    desc = t('premium.desc.free', locale);
                } else if (server.isToken) {
                    desc = t('premium.desc.token', locale);
                } else {
                    desc = t('premium.desc.premium', locale);
                }

                const title = t('premium.title', locale, { serverName: server.name });
                const expiresLabel = t('premium.expires', locale);
                const votesLabel = t('premium.votes', locale);
                const weeklyHypeLabel = t('premium.weekly_hype', locale);

                const content = `### ${title}\n\n` +
                    `**Tier:** ${tierLabel}\n` +
                    `**${expiresLabel}:** ${expiryText}\n` +
                    `**${votesLabel}:** ${server.votes.toLocaleString()}\n` +
                    `**${weeklyHypeLabel}:** ${Math.round(server.weeklyHypeScore).toLocaleString()}\n\n` +
                    `${desc}`;

                await sendV2Result(content);
            } catch (error) {
                console.error('[Premium Status] Error:', error);
                return interaction.editReply(t('premium.failed', locale));
            }
        }
    },
});
