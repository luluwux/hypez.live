import {
    Events,
    ChannelType,
    TextChannel,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MessageFlags,
} from 'discord.js';
import { Event } from '../structures/event';
import { apiClient } from '../utils/api-client';
import { logGuildJoin, logGuildJoinChannel } from '../services/webhook-logger';

const WEB_URL = process.env.WEB_URL || 'https://hypez.live';

async function createPermanentInvite(guild: any): Promise<string | null> {
    const botMember = guild.members.me;
    const channel = guild.channels.cache.find(
        (c: any) =>
            (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) &&
            botMember &&
            botMember.permissionsIn(c).has(PermissionFlagsBits.CreateInstantInvite)
    ) as TextChannel | undefined;

    if (!channel) return null;

    const invite = await (channel as TextChannel).createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: false,
        reason: 'Hypez server listing — permanent invite',
    });

    return `https://discord.gg/${invite.code}`;
}

/**
 * Container v2 tabanlı kurulum paneli mesajı oluşturur.
 * embed kullanmaz; tamamen Discord Components V2 (ContainerBuilder) ile çalışır.
 */
function buildSetupPanel(categoriesOptions: { label: string; value: string; emoji: string }[]) {
    // ContainerBuilder yalnızca son discord.js sürümlerinde mevcut olduğundan
    // runtime require ile erişiyoruz (settings.ts ile aynı pattern).
    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');

    const panelContent =
        `## 👋 Hypez Kurulum Paneli / Setup Panel\n\n` +
        `🇹🇷 **Hoş Geldiniz!** Sunucunuz Hypez'e başarıyla kaydedildi.\n` +
        `Keşfet listelerinde görünebilmek için **kurulumu tamamlamanız gerekmektedir**.\n\n` +
        `🇬🇧 **Welcome!** Your server was successfully registered on Hypez.\n` +
        `You must **complete the setup** to appear on the discovery list.\n\n` +
        `**Durum / Status:** ⏳ Kurulum Bekleniyor (Setup Pending)\n` +
        `- **Dil / Language:** ❌ Belirlenmedi (Not set)\n` +
        `- **Kategori / Categories:** ❌ Belirlenmedi (Not set)\n` +
        `- **Açıklama / Description:** ❌ Belirlenmedi (Not set)`;

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(panelContent),
    );

    try {
        container.addSeparatorComponents(new SeparatorBuilder());
    } catch {
        // SeparatorBuilder opsiyonel — desteklenmiyorsa atla
    }

    return container;
}

export default new Event({
    name: Events.GuildCreate,
    execute: async (client, guild) => {
        console.log(`[GuildCreate] Joined guild: ${guild.name} (${guild.id})`);

        try {
            await guild.fetch();

            const banner = guild.bannerURL({ size: 1024, extension: 'webp' });
            const voiceStates = guild.voiceStates.cache;

            const emojis = guild.emojis.cache.map((emoji) => ({
                emojiId: emoji.id,
                name: emoji.name || 'Unknown',
                url: emoji.imageURL() || '',
                animated: emoji.animated || false,
            }));

            const stickers = guild.stickers.cache.map((sticker) => ({
                stickerId: sticker.id,
                name: sticker.name,
                url: sticker.url,
                format: sticker.format.toString(),
            }));

            const textChannels = guild.channels.cache.filter(
                c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildForum || c.type === ChannelType.GuildAnnouncement
            );
            const voiceChannels = guild.channels.cache.filter(
                c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
            );

            let inviteUrl: string | null | undefined;
            try {
                inviteUrl = await createPermanentInvite(guild);
                if (inviteUrl) {
                    console.log(`[GuildCreate] Auto-generated invite for ${guild.name}: ${inviteUrl}`);
                }
            } catch (inviteErr) {
                console.warn(`[GuildCreate] Could not auto-create invite for ${guild.name}:`, inviteErr);
            }

            await apiClient.syncServer({
                id: guild.id,
                name: guild.name,
                description: guild.description || null,
                icon: guild.iconURL() || '',
                banner: banner || null,
                ownerId: guild.ownerId,
                memberCount: guild.memberCount || 0,
                activeMemberCount: guild.approximatePresenceCount || 0,
                channelCount: textChannels.size,
                voiceChannelCount: voiceChannels.size,
                roleCount: guild.roles.cache.size,
                emojiCount: emojis.length,
                stickerCount: stickers.length,
                boostCount: guild.premiumSubscriptionCount || 0,
                voiceMemberCount: voiceStates.size,
                streamingMemberCount: voiceStates.filter((vs) => !!vs.streaming).size,
                videoMemberCount: voiceStates.filter((vs) => !!vs.selfVideo).size,
                normalVoiceMemberCount: voiceStates.filter((vs) => !vs.streaming && !vs.selfVideo).size,
                categories: [],
                badges: [],
                inviteUrl: inviteUrl ?? undefined,
                emojis,
                stickers,
            });

            console.log(`[GuildCreate] Synced ${guild.name} via API (${emojis.length} emojis, ${stickers.length} stickers, invite=${!!inviteUrl}).`);

            logGuildJoin({
                name: guild.name,
                id: guild.id,
                memberCount: guild.memberCount,
            });

            await logGuildJoinChannel(client, {
                name: guild.name,
                id: guild.id,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
            });
            let targetChannel: TextChannel | null = null;
            const botMember = guild.members.me;

            if (
                guild.systemChannel &&
                botMember &&
                guild.systemChannel
                    .permissionsFor(botMember)
                    .has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel])
            ) {
                targetChannel = guild.systemChannel;
            } else {
                targetChannel = guild.channels.cache.find(
                    (c: any) =>
                        c.type === ChannelType.GuildText &&
                        botMember &&
                        c.permissionsFor(botMember).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel])
                ) as TextChannel | null;
            }

            if (!targetChannel) {
                console.warn(`[GuildCreate] No suitable text channel found in ${guild.name} to send setup panel.`);
                return;
            }

            const activeCategories = await apiClient.fetchActiveCategories().catch(() => []);
            const categoriesOptions = activeCategories.length > 0
                ? activeCategories.map((cat: any) => ({
                    label: cat.name,
                    value: cat.slug,
                    emoji: cat.emoji || '📁',
                }))
                : [
                    { label: 'Gaming', value: 'gaming', emoji: '🎮' },
                    { label: 'Social', value: 'social', emoji: '💬' },
                    { label: 'Music', value: 'music', emoji: '🎵' },
                    { label: 'Community', value: 'community', emoji: '👥' },
                ];

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('setup_category_select')
                .setPlaceholder('📁 Kategori Seçin / Select Categories (1-3)')
                .setMinValues(1)
                .setMaxValues(3)
                .addOptions(categoriesOptions.slice(0, 25));

            const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('setup_lang_tr')
                    .setLabel('Türkçe')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🇹🇷'),
                new ButtonBuilder()
                    .setCustomId('setup_lang_en')
                    .setLabel('English')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🇬🇧'),
                new ButtonBuilder()
                    .setCustomId('setup_desc_btn')
                    .setLabel('Açıklama Ayarla / Set Description')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝'),
            );

            const completeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('setup_complete_btn')
                    .setLabel('Kurulumu Tamamla / Complete Setup')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
            );

            // Container v2 ile gönder — embed yok
            try {
                const container = buildSetupPanel(categoriesOptions);

                await targetChannel.send({
                    components: [container, menuRow, buttonsRow, completeRow],
                    flags: MessageFlags.IsComponentsV2,
                } as any);

                console.log(`[GuildCreate] Sent Container v2 setup panel to ${guild.name} in #${targetChannel.name}`);
            } catch (sendErr) {
                // Container v2 desteklenmiyorsa sade metin fallback
                console.warn(`[GuildCreate] ContainerBuilder failed, falling back to plain message:`, sendErr);

                await targetChannel.send({
                    content:
                        `## 👋 Hypez Kurulum Paneli / Setup Panel\n\n` +
                        `🇹🇷 Sunucunuz Hypez'e kaydedildi. Keşfet listelerinde görünmek için kurulumu tamamlayın.\n` +
                        `🇬🇧 Your server was registered. Complete the setup to appear on discovery lists.\n\n` +
                        `**Durum / Status:** ⏳ Kurulum Bekleniyor (Setup Pending)`,
                    components: [menuRow, buttonsRow, completeRow],
                });
            }

        } catch (error) {
            console.error(`[GuildCreate] Failed to sync guild ${guild.name}:`, error);
        }
    },
});
