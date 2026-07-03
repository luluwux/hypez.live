import {
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ChatInputCommandInteraction,
    AttachmentBuilder,
    MessageFlags,
    ContainerBuilder,
    SectionBuilder,
    ThumbnailBuilder,
} from 'discord.js';
import { Command } from '../../structures/command';
import { HypezClient } from '../../structures/client';
import { apiClient } from '../../utils/api-client';
import { ensureBanner } from '../../services/banner.service';
import { getLocale, t } from '../../utils/i18n';

const WEB_URL = process.env.WEB_URL || 'https://hypez.live';

class SetupCommandLogic {
    constructor(private client: HypezClient, private interaction: ChatInputCommandInteraction) {}

    async run() {
        const guildId = this.interaction.guild!.id;

        const server = await this.getServerData(guildId);
        const locale = server?.locale || 'en';

        if (!server) {
            return this.interaction.editReply({
                content: t('common.server_not_registered', locale),
            });
        }

        const rank = await this.calculateRank(server.votes);

        const container = this.buildContainer({ server, rank, locale });

        await this.sendSetupMessage(container, guildId, locale);
    }

    private async getServerData(guildId: string) {
        return this.client.prisma.server.findUnique({
            where: { id: guildId },
            select: {
                name: true,
                votes: true,
                weeklyHypeScore: true,
                totalHypeScore: true,
                lastVoterId: true,
                lastVotedAt: true,
                locale: true,
            },
        });
    }

    private async calculateRank(votes: number) {
        const betterServers = await this.client.prisma.server.count({
            where: { votes: { gt: votes } },
        });
        return betterServers + 1;
    }

    private async resolveDiscordIds(userIds: string[]): Promise<Map<string, string>> {
        const idMap = new Map<string, string>();
        const cuids: string[] = [];

        for (const id of userIds) {
            if (/^\d+$/.test(id)) {
                // Zaten Discord Snowflake ID'si
                idMap.set(id, id);
            } else {
                cuids.push(id);
            }
        }

        if (cuids.length > 0) {
            // CUID'leri tek bir toplu sorguyla Discord ID'lerine (providerAccountId) eşleştiriyoruz
            const accounts = await this.client.prisma.account.findMany({
                where: {
                    userId: { in: cuids },
                    provider: 'discord'
                },
                select: {
                    userId: true,
                    providerAccountId: true
                }
            });

            for (const acc of accounts) {
                idMap.set(acc.userId, acc.providerAccountId);
            }

            // Eşleşmeyen CUID'ler için kendi ID'sini koruyoruz
            for (const id of cuids) {
                if (!idMap.has(id)) {
                    idMap.set(id, id);
                }
            }
        }

        return idMap;
    }

    private async getTopVoters(guildId: string) {
        // 1. Tüm benzersiz userId gruplarını çekiyoruz
        const rawGroups = await this.client.prisma.vote.groupBy({
            by: ['userId'],
            where: { guildId },
            _count: { userId: true },
        });

        if (rawGroups.length === 0) return [];

        // 2. Tüm benzersiz userId'leri Discord ID'lerine çözümleyelim (tek bir sorgu ile)
        const userIds = rawGroups.map(g => g.userId);
        const discordIdMap = await this.resolveDiscordIds(userIds);

        // 3. Discord ID'si bazında oyları birleştirip toplayalım
        const aggregated = new Map<string, number>();
        for (const group of rawGroups) {
            const discordId = discordIdMap.get(group.userId) || group.userId;
            const current = aggregated.get(discordId) || 0;
            aggregated.set(discordId, current + group._count.userId);
        }

        // 4. Sıralayıp ilk 10'u alalım
        const sorted = Array.from(aggregated.entries())
            .map(([discordId, count]) => ({ discordId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 5. Discord ID'leri ve CUID'leri User tablosundaki name alanlarıyla eşleştirelim
        const discordToCuids = new Map<string, string[]>();
        for (const [cuid, discId] of discordIdMap.entries()) {
            if (cuid !== discId) {
                const list = discordToCuids.get(discId) || [];
                list.push(cuid);
                discordToCuids.set(discId, list);
            }
        }

        const allDbIds = new Set<string>();
        for (const item of sorted) {
            allDbIds.add(item.discordId);
            const cuids = discordToCuids.get(item.discordId) || [];
            for (const cuid of cuids) {
                allDbIds.add(cuid);
            }
        }

        const dbUsers = await this.client.prisma.user.findMany({
            where: { id: { in: Array.from(allDbIds) } },
            select: { id: true, name: true }
        });

        const userNamesMap = new Map<string, string>();
        for (const u of dbUsers) {
            if (u.name) {
                userNamesMap.set(u.id, u.name);
            }
        }

        // 6. Sonuçları oluşturalım
        return Promise.all(
            sorted.map(async (item, index) => {
                let username = 'Gizli Kullanıcı';
                
                // Öncelik 1: Discord ID'sinin User tablosundaki adı
                if (userNamesMap.has(item.discordId)) {
                    username = userNamesMap.get(item.discordId)!;
                } else {
                    // Öncelik 2: İlişkili CUID'lerin User tablosundaki adı
                    const cuids = discordToCuids.get(item.discordId) || [];
                    const foundCuidWithName = cuids.find(cuid => userNamesMap.has(cuid));
                    if (foundCuidWithName) {
                        username = userNamesMap.get(foundCuidWithName)!;
                    } else {
                        // Öncelik 3: Discord API'den çekelim
                        if (/^\d+$/.test(item.discordId)) {
                            const user = await this.client.users.fetch(item.discordId).catch(() => null);
                            if (user) username = user.username;
                        }
                    }
                }

                return { username, count: item.count, rank: index + 1 };
            })
        );
    }

    private async getTopHypers(guildId: string) {
        // 1. Tüm benzersiz userId gruplarını çekiyoruz
        const rawGroups = await this.client.prisma.hypeVote.groupBy({
            by: ['userId'],
            where: { serverId: guildId },
            _count: { userId: true },
        });

        if (rawGroups.length === 0) return [];

        // 2. Tüm benzersiz userId'leri Discord ID'lerine çözümleyelim (tek bir sorgu ile)
        const userIds = rawGroups.map(g => g.userId);
        const discordIdMap = await this.resolveDiscordIds(userIds);

        // 3. Discord ID'si bazında hypeları birleştirip toplayalım
        const aggregated = new Map<string, number>();
        for (const group of rawGroups) {
            const discordId = discordIdMap.get(group.userId) || group.userId;
            const current = aggregated.get(discordId) || 0;
            aggregated.set(discordId, current + group._count.userId);
        }

        // 4. Sıralayıp ilk 20'yi alalım
        const sorted = Array.from(aggregated.entries())
            .map(([discordId, count]) => ({ discordId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        // 5. Discord ID'leri ve CUID'leri User tablosundaki name alanlarıyla eşleştirelim
        const discordToCuids = new Map<string, string[]>();
        for (const [cuid, discId] of discordIdMap.entries()) {
            if (cuid !== discId) {
                const list = discordToCuids.get(discId) || [];
                list.push(cuid);
                discordToCuids.set(discId, list);
            }
        }

        const allDbIds = new Set<string>();
        for (const item of sorted) {
            allDbIds.add(item.discordId);
            const cuids = discordToCuids.get(item.discordId) || [];
            for (const cuid of cuids) {
                allDbIds.add(cuid);
            }
        }

        const dbUsers = await this.client.prisma.user.findMany({
            where: { id: { in: Array.from(allDbIds) } },
            select: { id: true, name: true }
        });

        const userNamesMap = new Map<string, string>();
        for (const u of dbUsers) {
            if (u.name) {
                userNamesMap.set(u.id, u.name);
            }
        }

        // 6. Sonuçları oluşturalım
        return Promise.all(
            sorted.map(async (item, index) => {
                let username = 'Gizli Kullanıcı';
                
                // Öncelik 1: Discord ID'sinin User tablosundaki adı
                if (userNamesMap.has(item.discordId)) {
                    username = userNamesMap.get(item.discordId)!;
                } else {
                    // Öncelik 2: İlişkili CUID'lerin User tablosundaki adı
                    const cuids = discordToCuids.get(item.discordId) || [];
                    const foundCuidWithName = cuids.find(cuid => userNamesMap.has(cuid));
                    if (foundCuidWithName) {
                        username = userNamesMap.get(foundCuidWithName)!;
                    } else {
                        // Öncelik 3: Discord API'den çekelim
                        if (/^\d+$/.test(item.discordId)) {
                            const user = await this.client.users.fetch(item.discordId).catch(() => null);
                            if (user) username = user.username;
                        }
                    }
                }

                return { username, count: item.count, rank: index + 1 };
            })
        );
    }

    private async getLastVoterName(lastVoterId: string | null) {
        if (!lastVoterId) return null;
        try {
            // CUID ise Discord ID'sine çevirelim
            let discordId = lastVoterId;
            if (!/^\d+$/.test(lastVoterId)) {
                const account = await this.client.prisma.account.findFirst({
                    where: { userId: lastVoterId, provider: 'discord' },
                    select: { providerAccountId: true }
                });
                if (account?.providerAccountId) {
                    discordId = account.providerAccountId;
                }
            }

            // Önce veritabanından çekelim (CUID veya Discord ID ile)
            const dbUser = await this.client.prisma.user.findFirst({
                where: {
                    OR: [
                        { id: lastVoterId },
                        { id: discordId }
                    ]
                },
                select: { name: true }
            });
            if (dbUser?.name) return dbUser.name;

            // Bulunamazsa Discord API'den çekelim
            if (/^\d+$/.test(discordId)) {
                const user = await this.client.users.fetch(discordId).catch(() => null);
                if (user) return user.username;
            }
        } catch { /* ignore */ }
        return null;
    }

    private buildContainer(options: { server: any; rank: number; locale: string }): ContainerBuilder {
        const { server, rank, locale } = options;
        const guildId = this.interaction.guild!.id;
        const serverPageUrl = `${WEB_URL}/servers/${guildId}`;

        const container = new ContainerBuilder();

        const voteBtn = t('setup.board.vote_btn', locale);
        const viewBtn = t('setup.board.view_btn', locale);

        const description = t('setup.board.desc', locale)
            .replace('{votes}', server.votes.toLocaleString())
            .replace('{hype}', Math.round(server.weeklyHypeScore).toLocaleString())
            .replace('{rank}', String(rank));

        container.addSectionComponents((section: any) =>
            section
                .addTextDisplayComponents((text: any) =>
                    text.setContent(`# ${this.interaction.guild!.name}\n\n${description}`)
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(`${WEB_URL}/apple-touch-icon.png`)
                )
        );

        container.addActionRowComponents((row: any) =>
            row.setComponents(
                new ButtonBuilder()
                    .setCustomId('container_vote')
                    .setLabel(voteBtn)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🤍'),
                new ButtonBuilder()
                    .setCustomId('container_hype')
                    .setLabel('Hype')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:Hypez:1515304864148881418>'),
                new ButtonBuilder()
                    .setURL(serverPageUrl)
                    .setLabel(viewBtn)
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🔗'),
            ),
        );

        return container;
    }

    private async sendSetupMessage(container: any, guildId: string, locale: string) {
        try {
            const message = await this.interaction.editReply({
                content: '',
                embeds: [],
                components: [container],
                files: [],
                flags: MessageFlags.IsComponentsV2,
            } as any);

            await apiClient.updateServer(guildId, {
                leaderboardChannelId: message.channelId,
                leaderboardMessageId: message.id,
            });

            console.log(`[Setup] Kuruldu: guild=${guildId} | message=${message.id}`);
        } catch (error) {
            console.error('[Setup] Hata:', error);
            const msg = error instanceof Error ? error.message : 'Bilinmeyen hata';

            try {
                await this.interaction.editReply({
                    content: `❌ **${t('setup.error_prefix', locale)}**\n\`\`\`\n${msg}\n\`\`\``,
                    embeds: [],
                    components: [],
                    files: [],
                });
            } catch {
                await this.interaction.editReply({ content: `❌ Hata: \`${msg}\`` }).catch(() => {});
            }
        }
    }
}

export default new Command({
    name: 'setup',
    description: 'Sunucu oy panosunu kurar ve kanala kalıcı mesaj gönderir',
    options: [],
    execute: async (client: HypezClient, interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) return;

        // Defer reply immediately to avoid Discord's 3-second timeout "Unknown interaction" error
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const locale = await getLocale(client, guildId);

        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.editReply({
                content: t('common.admin_only', locale),
            });
        }

        const setupLogic = new SetupCommandLogic(client, interaction);
        await setupLogic.run();
    },
});
