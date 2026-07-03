import {
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import { Event } from '../structures/event';
import { getLocale, t } from '../utils/i18n';
import { apiClient } from '../utils/api-client';
import { handleVoteFlow } from '../handlers/vote.handler';
import { handleHypeFlow } from '../handlers/hype.handler';
import { checkGuildRateLimit } from '../utils/guild-rate-limit';
import { redisClient } from '../utils/redis';
/**
 * ContainerBuilder + TextDisplayBuilder helper.
 */
function buildContainer(content: string): ContainerBuilder {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    return container;
}

/**
 * Kurulum paneli için kategoriler + butonlar + tamamla ActionRow'larını döner.
 * Hem guildCreate hem de updateSetupPanel tarafından kullanılır.
 */
function buildSetupRows(opts: {
    categoriesOptions: { label: string; value: string; emoji: string; default?: boolean }[];
    locale: string | null;
    hasDescription: boolean;
}) {
    const { categoriesOptions, locale, hasDescription } = opts;
    const isTr = locale === 'tr';

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('setup_category_select')
        .setPlaceholder(isTr ? '📁 Kategori Seçin (1-3)' : '📁 Select Categories (1-3)')
        .setMinValues(1)
        .setMaxValues(3)
        .addOptions(categoriesOptions.slice(0, 25));

    const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('setup_lang_tr')
            .setLabel('Türkçe')
            .setStyle(locale === 'tr' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji('🇹🇷'),
        new ButtonBuilder()
            .setCustomId('setup_lang_en')
            .setLabel('English')
            .setStyle(locale === 'en' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji('🇬🇧'),
        new ButtonBuilder()
            .setCustomId('setup_desc_btn')
            .setLabel(isTr ? 'Açıklama Ayarla' : 'Set Description')
            .setStyle(hasDescription ? ButtonStyle.Success : ButtonStyle.Primary)
            .setEmoji('📝'),
    );

    const completeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('setup_complete_btn')
            .setLabel(isTr ? 'Kurulumu Tamamla' : 'Complete Setup')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
    );

    return { menuRow, buttonsRow, completeRow };
}
export default new Event({
    name: 'interactionCreate',
    execute: async (client, interaction) => {
        // Per-Guild Rate Limit
        if (interaction.guildId) {
            const rawRedis = redisClient.getRawClient();
            if (rawRedis) {
                let action = 'unknown';
                if (interaction.isChatInputCommand()) action = interaction.commandName;
                else if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) action = interaction.customId;

                const allowed = await checkGuildRateLimit({ redis: rawRedis, guildId: interaction.guildId, action, maxPerMinute: 30 });
                if (!allowed) {
                    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                        const locale = await getLocale(client, interaction.guildId);
                        return interaction.reply({ content: t('rate_limit', locale), flags: [MessageFlags.Ephemeral] });
                    }
                    return;
                }
            }
        }

        if (interaction.isChatInputCommand()) return handleChatInputCommand(client, interaction);
        if (interaction.isButton()) return handleButtonInteraction(client, interaction);
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'setup_description_modal') return handleSetupDescriptionSubmit(client, interaction);
        }
        if (interaction.isStringSelectMenu()) return handleSelectMenu(client, interaction);
    },
});
async function handleChatInputCommand(client: any, interaction: any) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(client, interaction);
    } catch (error) {
        console.error(error);
        const locale = interaction.guildId ? await getLocale(client, interaction.guildId) : 'en';
        const content = t('system_error', locale);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.reply({ content, flags: [MessageFlags.Ephemeral] });
        }
    }
}

async function handleButtonInteraction(client: any, interaction: any) {
    try {
        const locale = interaction.guildId ? await getLocale(client, interaction.guildId) : 'en';
        if (interaction.customId === 'container_vote') {
            if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            return handleVoteFlow(client, interaction);
        }

        if (interaction.customId === 'container_hype') {
            if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            return handleHypeFlow(client, interaction);
        }
        if (interaction.customId === 'settings_language') {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('settings_language_select')
                .setPlaceholder(t('settings.language.placeholder', locale))
                .addOptions([
                    { label: 'Türkçe', value: 'tr', emoji: '🇹🇷', description: 'Turkish' },
                    { label: 'English', value: 'en', emoji: '🇬🇧', description: 'English' },
                ]);

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
            return interaction.reply({ content: t('settings.language.select', locale), components: [row], flags: [MessageFlags.Ephemeral] });
        }

        if (interaction.customId === 'settings_main_category') {
            const activeCategories = await apiClient.fetchActiveCategories();
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('settings_main_category_select')
                .setPlaceholder(t('settings.categories.placeholder', locale))
                .setMinValues(1)
                .setMaxValues(3)
                .addOptions(activeCategories.map(cat => ({ label: cat.name, value: cat.slug, emoji: cat.emoji })));

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
            return interaction.reply({ content: t('settings.categories.title', locale), components: [row], flags: [MessageFlags.Ephemeral] });
        }
        if (interaction.customId === 'setup_lang_tr' || interaction.customId === 'setup_lang_en') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu işlemi yapmak için **Administrator** yetkisine ihtiyacınız var!',
                    flags: [MessageFlags.Ephemeral],
                });
            }
            const lang = interaction.customId === 'setup_lang_tr' ? 'tr' : 'en';
            try {
                await interaction.deferUpdate();
                await apiClient.updateServer(interaction.guildId!, { locale: lang });
                await updateSetupPanel(client, interaction);
            } catch (e) {
                console.error('[Setup] Language update error:', e);
                return interaction.followUp({ content: '❌ Dil güncellenirken hata oluştu!', flags: [MessageFlags.Ephemeral] });
            }
            return;
        }
        if (interaction.customId === 'setup_desc_btn') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu işlemi yapmak için **Administrator** yetkisine ihtiyacınız var!',
                    flags: [MessageFlags.Ephemeral],
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('setup_description_modal')
                .setTitle('Açıklama / Description');

            const descInput = new TextInputBuilder()
                .setCustomId('setup_desc_input')
                .setLabel('Sunucu Açıklaması / Server Description')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(10)
                .setMaxLength(1000)
                .setRequired(true)
                .setPlaceholder('Sunucunuzu kısaca tanıtın... / Describe your server...');

            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(descInput));
            return interaction.showModal(modal);
        }
        if (interaction.customId === 'setup_complete_btn') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Bu işlemi yapmak için **Administrator** yetkisine ihtiyacınız var!',
                    flags: [MessageFlags.Ephemeral],
                });
            }

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const server = await client.prisma.server.findUnique({
                where: { id: interaction.guildId! },
                select: { locale: true, categories: true, description: true },
            });

            if (!server) {
                return interaction.editReply({ content: '❌ Sunucu DB\'de bulunamadı! Botu çıkarıp tekrar ekleyin.' });
            }

            const hasLocale      = !!server.locale;
            const hasCategories  = Array.isArray(server.categories) && server.categories.length > 0;
            const hasDescription = typeof server.description === 'string' && server.description.trim().length >= 10;
            const isTr           = server.locale === 'tr';

            if (!hasLocale || !hasCategories || !hasDescription) {
                const missing: string[] = [];
                if (!hasLocale)      missing.push(isTr ? '🌍 Dil seçimi' : '🌍 Language');
                if (!hasCategories)  missing.push(isTr ? '📁 Kategori (en az 1)' : '📁 Category (min 1)');
                if (!hasDescription) missing.push(isTr ? '📝 Açıklama (en az 10 karakter)' : '📝 Description (min 10 chars)');

                return interaction.editReply({
                    content: isTr
                        ? `❌ **Eksik adımlar:**\n${missing.map(m => `- ${m}`).join('\n')}`
                        : `❌ **Missing steps:**\n${missing.map(m => `- ${m}`).join('\n')}`,
                });
            }

            await apiClient.updateServer(interaction.guildId!, { isVisible: true });

            const WEB_URL = process.env.WEB_URL || 'https://hypez.live';
            const successContent = isTr
                ? `## 🎉 Kurulum Tamamlandı!\n\n✅ Sunucunuz başarıyla aktifleştirildi. Artık Hypez keşfet listelerinde görünürsünüz!\n\n🌐 ${WEB_URL}`
                : `## 🎉 Setup Completed!\n\n✅ Your server is now live on Hypez discovery lists!\n\n🌐 ${WEB_URL}`;

            const container = buildContainer(successContent);
            await interaction.message.edit({
                content: '',
                embeds: [],
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            } as any);

            return interaction.editReply({
                content: isTr ? '✅ Sunucunuz listelere eklendi!' : '✅ Your server has been listed!',
            });
        }

    } catch (error) {
        console.error('Interaction Error (Button):', error);
        const locale = interaction.guildId ? await getLocale(client, interaction.guildId) : 'en';
        const errContent = t('system_error', locale);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errContent, flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.followUp({ content: errContent, flags: [MessageFlags.Ephemeral] });
        }
    }
}

async function handleSetupDescriptionSubmit(client: any, interaction: any) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: '❌ Bu işlemi yapmak için **Administrator** yetkisine ihtiyacınız var!',
            flags: [MessageFlags.Ephemeral],
        });
    }
    const description = interaction.fields.getTextInputValue('setup_desc_input');
    try {
        await interaction.deferUpdate();
        await apiClient.updateServer(interaction.guildId!, { description });
        await updateSetupPanel(client, interaction);
    } catch (e) {
        console.error('[Setup] Description update error:', e);
        return interaction.followUp({ content: '❌ Açıklama güncellenirken hata oluştu!', flags: [MessageFlags.Ephemeral] });
    }
}

async function handleSelectMenu(client: any, interaction: any) {
    const locale = interaction.guildId ? await getLocale(client, interaction.guildId) : 'en';
    if (interaction.customId === 'settings_language_select') {
        const lang = interaction.values[0];
        try {
            await interaction.deferUpdate();
            await apiClient.updateServer(interaction.guildId!, { locale: lang });
            const flag = lang === 'tr' ? '🇹🇷' : '🇬🇧';
            const name = lang === 'tr' ? 'Türkçe' : 'English';
            return interaction.followUp({ content: t('settings.language.updated', lang, { flag, name }), flags: [MessageFlags.Ephemeral] });
        } catch (e) {
            console.error('[Settings] Language error:', e);
            return interaction.followUp({ content: t('settings.language.error', locale), flags: [MessageFlags.Ephemeral] });
        }
    }
    if (interaction.customId === 'settings_main_category_select' || interaction.customId === 'settings_category_select') {
        const selectedCats = interaction.values;
        try {
            await interaction.deferUpdate();
            await apiClient.updateServer(interaction.guildId!, { categories: selectedCats });

            const allCategories = await apiClient.fetchActiveCategories();
            const catNames = selectedCats.map((id: string) => {
                const cat = allCategories.find(c => c.id === id || c.slug === id);
                return cat ? `${cat.emoji} **${cat.name}**` : `\`${id}\``;
            }).join(', ');

            return interaction.followUp({ content: t('settings.categories.updated.info', locale, { catNames }), flags: [MessageFlags.Ephemeral] });
        } catch (e) {
            console.error('[Settings] Category error:', e);
            return interaction.followUp({ content: t('settings.categories.error', locale), flags: [MessageFlags.Ephemeral] });
        }
    }
    if (interaction.customId === 'setup_category_select') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Bu işlemi yapmak için **Administrator** yetkisine ihtiyacınız var!',
                flags: [MessageFlags.Ephemeral],
            });
        }
        try {
            await interaction.deferUpdate();
            await apiClient.updateServer(interaction.guildId!, { categories: interaction.values });
            await updateSetupPanel(client, interaction);
        } catch (e) {
            console.error('[Setup] Category update error:', e);
            return interaction.followUp({ content: '❌ Kategoriler güncellenirken hata oluştu!', flags: [MessageFlags.Ephemeral] });
        }
    }
}async function updateSetupPanel(client: any, interaction: any) {
    const server = await client.prisma.server.findUnique({
        where: { id: interaction.guildId! },
        select: { locale: true, categories: true, description: true },
    });
    if (!server) return;

    const activeCategories = await apiClient.fetchActiveCategories().catch(() => []);
    const isTr = server.locale === 'tr';    const langStatus = server.locale
        ? `✅ ${server.locale === 'tr' ? 'Türkçe 🇹🇷' : 'English 🇬🇧'}`
        : '❌ Belirlenmedi';

    const catStatus = Array.isArray(server.categories) && server.categories.length > 0
        ? `✅ ${server.categories.map((slug: string) => {
            const cat = activeCategories.find((c: any) => c.slug === slug || c.id === slug);
            return cat ? `${cat.emoji} ${cat.name}` : `\`${slug}\``;
        }).join(', ')}`
        : '❌ Belirlenmedi';

    const descStatus = typeof server.description === 'string' && server.description.trim().length > 0
        ? `✅ ${server.description.length > 60 ? server.description.slice(0, 60) + '...' : server.description}`
        : '❌ Belirlenmedi';    const panelContent = isTr
        ? `## 👋 Hypez Kurulum Paneli\n\n` +
          `🇹🇷 Sunucunuz Hypez'e kaydedildi. Keşfet listelerinde görünmek için aşağıdaki adımları tamamlayın.\n\n` +
          `**Dil:** ${langStatus}\n` +
          `**Kategori:** ${catStatus}\n` +
          `**Açıklama:** ${descStatus}`
        : `## 👋 Hypez Setup Panel\n\n` +
          `🇬🇧 Your server is registered. Complete the steps below to appear on discovery lists.\n\n` +
          `**Language:** ${langStatus}\n` +
          `**Categories:** ${catStatus}\n` +
          `**Description:** ${descStatus}`;    const categoriesOptions = activeCategories.length > 0
        ? activeCategories.map((cat: any) => ({
            label: cat.name,
            value: cat.slug,
            emoji: cat.emoji || '📁',
            default: Array.isArray(server.categories) && server.categories.includes(cat.slug),
        }))
        : [
            { label: 'Gaming',    value: 'gaming',    emoji: '🎮', default: server.categories?.includes('gaming')    ?? false },
            { label: 'Social',    value: 'social',    emoji: '💬', default: server.categories?.includes('social')    ?? false },
            { label: 'Music',     value: 'music',     emoji: '🎵', default: server.categories?.includes('music')     ?? false },
            { label: 'Community', value: 'community', emoji: '👥', default: server.categories?.includes('community') ?? false },
        ];

    const { menuRow, buttonsRow, completeRow } = buildSetupRows({
        categoriesOptions,
        locale: server.locale,
        hasDescription: typeof server.description === 'string' && server.description.trim().length >= 10,
    });

    const container = buildContainer(panelContent);
    await interaction.message.edit({
        content: '',
        embeds: [],
        components: [container, menuRow, buttonsRow, completeRow],
        flags: MessageFlags.IsComponentsV2,
    } as any);
}
