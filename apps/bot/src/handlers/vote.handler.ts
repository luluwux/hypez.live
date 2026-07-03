import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    RepliableInteraction,
    CacheType,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} from 'discord.js';
import { HypezClient } from '../structures/client';
import { getLocale, t } from '../utils/i18n';
import { updateLeaderboard } from './leaderboard.handler';
import { apiClient, BotApiError } from '../utils/api-client';
import { captchaPool } from '../services/captcha-pool.service';
import { redisClient } from '../utils/redis';

const OWNER_ID = process.env.OWNER_ID ?? '';

/**
 * API'nin döndürdüğü nextVoteAvailable ISO string'ini Discord timestamp'e çevirir.
 * Eğer tarih parse edilemezse "daha sonra" / "later" döner.
 */
function formatNextVoteTime(isoString: string | undefined, locale: string): string {
    if (!isoString) return locale === 'tr' ? 'daha sonra' : 'later';
    const ts = Math.floor(new Date(isoString).getTime() / 1000);
    if (isNaN(ts)) return locale === 'tr' ? 'daha sonra' : 'later';
    return `<t:${ts}:R>`; // Discord relative timestamp — "12 saat içinde"
}

export async function handleVoteFlow(
    client: HypezClient,
    interaction: RepliableInteraction<CacheType>,
): Promise<void> {
    const guildId = interaction.guildId;
    const userId  = interaction.user.id;
    if (!guildId) return;

    try {
        console.log('[VoteHandler] Processing vote interaction');

        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        }

        const locale = await getLocale(client, guildId);

        const sendV2Result = async (content: string, extraComponents: any[] = []) => {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(content)
            );

            await interaction.editReply({
                content: '',
                embeds: [],
                components: [container, ...extraComponents],
                files: [],
                flags: MessageFlags.IsComponentsV2,
            } as any);
        };

        if (OWNER_ID && userId === OWNER_ID) {
            const title = t('vote.owner.bypass', locale);
            const desc = t('vote.owner.note', locale);
            await sendV2Result(`### ${title}\n${desc}`);

            updateLeaderboard(client, guildId).catch(err =>
                console.error('[VoteHandler] Owner bypass leaderboard update failed:', err),
            );
            return;
        }

        const challenge = await captchaPool.getCaptcha();
        if (!challenge || !challenge.imageBuffer) {
            await interaction.editReply({ content: t('system_error', locale) });
            return;
        }

        const rawRedis = redisClient.getRawClient();
        if (!rawRedis) {
            console.error('[VoteHandler] Redis unavailable — refusing to bypass captcha');
            await interaction.editReply({ content: t('system_error', locale) });
            return;
        }

        const userKey = `captcha:ratelimit:user:${userId}`;
        const userAttempts = await rawRedis.incr(userKey);
        if (userAttempts === 1) await rawRedis.expire(userKey, 300);
        if (userAttempts > 3) {
            await interaction.editReply({ content: t('captcha.ratelimit', locale) });
            return;
        }

        const failKey = `captcha:fails:${userId}`;
        const fails = await rawRedis.get(failKey);
        if (fails && parseInt(fails) >= 5) {
            await interaction.editReply({ content: t('captcha.lockout', locale) });
            return;
        }

        await rawRedis.set(`captcha:answer:${interaction.id}`, challenge.answer, 'EX', 120);

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# ${t('vote.verification.title', locale)}\n` +
                `### Hypez Shield\n\n` +
                `${t('vote.verification.description', locale)}`
            )
        );

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL('attachment://captcha.png')
            )
        );

        const row = new ActionRowBuilder<ButtonBuilder>();
        challenge.options.forEach(opt => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`pool_verify:${interaction.id}:${opt}`)
                    .setLabel(opt)
                    .setStyle(ButtonStyle.Secondary),
            );
        });

        const msg = await interaction.editReply({
            content: '',
            embeds: [],
            components: [container, row],
            files: [{ attachment: challenge.imageBuffer, name: 'captcha.png' }],
            flags: MessageFlags.IsComponentsV2,
        } as any);

        try {
            const confirmation = await msg.awaitMessageComponent({
                filter: i => i.user.id === userId && !i.customId.startsWith('http'),
                time: 40_000,
            });

            const disabledRow = new ActionRowBuilder<ButtonBuilder>();
            (row.components as ButtonBuilder[]).forEach(c => {
                disabledRow.addComponents(ButtonBuilder.from(c).setDisabled(true));
            });
            await confirmation.update({ components: [disabledRow] });

            const [, captchaId, answer] = confirmation.customId.split(':');

            try {
                const correctAnswer = await rawRedis.get(`captcha:answer:${captchaId}`);
                if (!correctAnswer) {
                    await sendV2Result(`### ${t('captcha.timeout.title', locale)}\n${t('captcha.timeout.body', locale)}`);
                    return;
                }
                await rawRedis.del(`captcha:answer:${captchaId}`);

                if (correctAnswer !== answer) {
                    const failKey = `captcha:fails:${userId}`;
                    const fails = await rawRedis.incr(failKey);
                    if (fails === 1) await rawRedis.expire(failKey, 3600);
                    await sendV2Result(`### ${t('vote.wrong.title', locale)}\n${t('captcha.wrong.body', locale, { command: '`/vote`' })}`);
                    return;
                }

                const username = interaction.user.username;
                const avatarUrl = interaction.user.displayAvatarURL({ size: 256 });
                const result = await apiClient.submitVote(guildId, userId, username, avatarUrl);

                const title = locale === 'tr' ? '✅ Doğrulama Başarılı!' : '✅ Verified!';
                const desc = t('vote.success', locale, {
                    serverName: result.server?.name ?? 'Unknown',
                    votes: result.server?.votes ?? '?',
                });

                await sendV2Result(`### ${title}\n${desc}`);

                updateLeaderboard(client, guildId).catch(err =>
                    console.error('[VoteHandler] Leaderboard update failed:', err),
                );

            } catch (err) {
                if (err instanceof BotApiError) {
                    if (err.status === 409) {
                        const body = err.body as { nextVoteAvailable?: string } | undefined;
                        const timeStr = formatNextVoteTime(body?.nextVoteAvailable, locale);
                        const title = t('vote.cooldown.title', locale);
                        const desc = t('vote.cooldown.description', locale, { time: timeStr });
                        
                        await sendV2Result(`### ${title}\n${desc}`);
                    } else if (err.status === 400) {
                        const title = t('vote.wrong.title', locale);
                        const desc = t('vote.wrong.description', locale);
                        await sendV2Result(`### ${title}\n${desc}`);
                    } else if (err.status === 403) {
                        const title = t('vote.error.title', locale);
                        const desc = t('vote.error.owner', locale);
                        await sendV2Result(`### ${title}\n${desc}`);
                    } else {
                        const title = t('vote.error.title', locale);
                        const desc = t('vote.error.description', locale);
                        await sendV2Result(`### ${title}\n${desc}\n\`\`\`\n${err.message}\n\`\`\``);
                    }
                } else {
                    const title = t('vote.error.title', locale);
                    const desc = t('vote.error.description', locale);
                    await sendV2Result(`### ${title}\n${desc}`);
                }
            }

        } catch (error: any) {
            // Zaman aşımı kontrolü (40 saniye dolduğunda buraya düşer)
            if (error?.code === 'InteractionCollectorError' || error?.message?.includes('time')) {
                const disabledRow = new ActionRowBuilder<ButtonBuilder>();
                (row.components as ButtonBuilder[]).forEach(c => {
                    disabledRow.addComponents(ButtonBuilder.from(c).setDisabled(true));
                });

                const title = t('vote.timeout.title', locale);
                const desc = t('vote.timeout.description', locale);
                
                await sendV2Result(`### ⏱️ ${title}\n${desc}`, [disabledRow]);
                return;
            }

            console.error('[VoteHandler] Unexpected error awaiting component:', error);
            const title = t('vote.error.title', locale);
            const desc = t('vote.error.description', locale);
            await sendV2Result(`### ${title}\n${desc}`);
        }

    } catch (error) {
        console.error('[VoteHandler] Fatal error:', error);
        try {
            const locale = await getLocale(client, guildId);
            if (!interaction.replied) {
                await interaction.editReply({ content: t('system_error', locale) });
            }
        } catch { /* ignore */ }
    }
}
