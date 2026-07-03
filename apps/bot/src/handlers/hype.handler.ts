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
import { apiClient, BotApiError } from '../utils/api-client';
import { updateLeaderboard } from './leaderboard.handler';
import { captchaPool } from '../services/captcha-pool.service';
import { redisClient } from '../utils/redis';
import { getLocale, t } from '../utils/i18n';

/** ISO hafta-yılı: "2025-W20" */
export function getWeekYear(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
    const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** Ağırlıklı puan — VoteService ile aynı formül */
export function calculateHypePoints(memberCount: number): number {
    return Math.round(100_000 / (Math.sqrt(Math.max(memberCount, 0)) + 1));
}

export async function handleHypeFlow(
    client: HypezClient,
    interaction: RepliableInteraction<CacheType>,
) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    if (!guildId) {
        const userLocale = interaction.locale.startsWith('tr') ? 'tr' : 'en';
        return interaction.reply({
            content: t('common.not_in_guild', userLocale),
            flags: [MessageFlags.Ephemeral],
        });
    }

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        }

        const locale = await getLocale(client, guildId);
        const guild = interaction.guild;
        const guildName = guild?.name ?? 'Unknown';
        const memberCount = guild?.memberCount ?? 0;
        const pointsPreview = calculateHypePoints(memberCount);

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

        const challenge = await captchaPool.getCaptcha();
        if (!challenge || !challenge.imageBuffer) {
            await interaction.editReply({ content: t('system_error', locale) });
            return;
        }

        const rawRedis = redisClient.getRawClient();
        if (!rawRedis) {
            console.error('[HypeHandler] Redis unavailable — refusing to bypass captcha');
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
                `# ${t('hype.embed.title', locale)}\n` +
                `### Hypez Shield\n\n` +
                `${t('hype.embed.desc', locale, {
                    serverName: guildName,
                    points: pointsPreview.toLocaleString(),
                })}`
            )
        );

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL('attachment://captcha.png')
            )
        );

        const row = new ActionRowBuilder<ButtonBuilder>();
        challenge.options.forEach((opt: string) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`hype_verify:${interaction.id}:${opt}`)
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
                filter: (i) => i.user.id === userId,
                time: 40_000,
            });

            const disabledRow = new ActionRowBuilder<ButtonBuilder>();
            (row.components as ButtonBuilder[]).forEach((c) => {
                const btn = ButtonBuilder.from(c);
                btn.setDisabled(true);
                disabledRow.addComponents(btn);
            });

            await confirmation.update({ components: [disabledRow] });

            const parts = confirmation.customId.split(':');
            const captchaId = parts[1];
            const answer = parts[2];

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
                    await sendV2Result(`### ${t('vote.wrong.title', locale)}\n${t('captcha.wrong.body', locale, { command: '`/hype`' })}`);
                    return;
                }
            } catch (err: any) {
                await sendV2Result(`### ${t('vote.error.title', locale)}\n${t('vote.failed', locale)}`);
                return;
            }

            try {
                const hypeResult = await apiClient.submitHype(guildId, userId);

                let nextAvailableStr = '';
                if (hypeResult.nextHypeAvailableAt) {
                    const ts = Math.floor(new Date(hypeResult.nextHypeAvailableAt).getTime() / 1000);
                    nextAvailableStr = t('hype.success.next_available', locale, { time: `<t:${ts}:R>` });
                } else {
                    nextAvailableStr = t('hype.success.weekly_limit', locale);
                }

                const title = t('hype.success.title', locale);
                const desc = t('hype.success.body', locale, {
                    serverName: guildName,
                    points: hypeResult.pointsAwarded.toLocaleString(),
                    remaining: hypeResult.weeklyRemaining,
                    total: hypeResult.weeklyUsed + hypeResult.weeklyRemaining,
                    nextAvailable: nextAvailableStr
                });

                const content = `### ${title}\n${desc}`;

                await sendV2Result(content);

                updateLeaderboard(client, guildId).catch((err: any) =>
                    console.error('[HypeHandler] Leaderboard update failed:', err),
                );
            } catch (err: any) {
                if (err instanceof BotApiError && err.status === 409) {
                    await sendV2Result(t('hype.cooldown', locale, { message: err.message }));
                } else if (err instanceof BotApiError && err.status === 404) {
                    await sendV2Result(t('hype.not_found', locale));
                } else if (err instanceof BotApiError && err.status === 403) {
                    await sendV2Result(t('hype.error.owner', locale));
                } else {
                    await sendV2Result(t('hype.error', locale));
                }
            }
        } catch (err: any) {
            if (err?.code === 'InteractionCollectorError' || err.message?.includes('time')) {
                const disabledRow = new ActionRowBuilder<ButtonBuilder>();
                (row.components as ButtonBuilder[]).forEach((c) => {
                    const btn = ButtonBuilder.from(c);
                    btn.setDisabled(true);
                    disabledRow.addComponents(btn);
                });
                await sendV2Result(`### ${t('vote.timeout.title', locale)}\n${t('vote.timeout.description', locale)}`, [disabledRow]);
            } else {
                throw err;
            }
        }
    } catch (error) {
        console.error('[HypeHandler] Error:', error);
        if (!interaction.replied) {
            const userLocale = interaction.guildId ? await getLocale(client, interaction.guildId) : 'en';
            await interaction.editReply({ content: t('system_error', userLocale) }).catch(() => {});
        }
    }
}

export function getNextSundayMidnight(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    const nextSunday = new Date(now);
    nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(0, 0, 0, 0);
    return nextSunday;
}
