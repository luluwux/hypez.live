import { Event } from '../structures/event';
import { ActivityType, Events } from 'discord.js';
import { startStatsReporter } from '../jobs/stats-reporter';
import { captchaPool } from '../services/captcha-pool.service';
import { Worker } from 'bullmq';
import { updateLeaderboardJob, runFullUpdateJob } from '../handlers/leaderboard.handler';

export default new Event({
    name: Events.ClientReady,
    once: true,
    execute: async (client) => {
        console.log(`Logged in as ${client.user?.tag}!`);

        // Set Activity
        const updateActivity = () => {
            client.user?.setActivity(`With ${client.guilds.cache.size} Servers!`, { type: ActivityType.Playing });
        };
        updateActivity();
        setInterval(updateActivity, 1000 * 60 * 60); // Her saat başı güncelle

        // Register Commands
        await client.loadCommands();
        await client.registerCommands();

        // Start periodic stats reporter (every 5 minutes)
        startStatsReporter(client);

        // Start background BullMQ worker in the same process to handle leaderboard updates
        try {
            const redisUrl = process.env.REDIS_URL?.replace('localhost', '127.0.0.1') || 'redis://127.0.0.1:6379';
            const worker = new Worker('leaderboard', async (job: any) => {
                const { guildId } = job.data;
                if (job.name === 'update') {
                    console.log(`[Worker] Processing text leaderboard update for ${guildId}`);
                    await updateLeaderboardJob(client, guildId);
                } else if (job.name === 'full-update') {
                    console.log(`[Worker] Processing FULL leaderboard update for ${guildId}`);
                    await runFullUpdateJob(client, guildId);
                }
            }, {
                connection: { 
                    url: redisUrl,
                    maxRetriesPerRequest: null
                },
                limiter: {
                    max: 50,       // maksimum 50 iş
                    duration: 1000, // her 1 saniyede
                },
                concurrency: 5
            });

            worker.on('error', err => {
                console.error('[Worker] Redis/BullMQ error:', err.message);
            });

            worker.on('completed', (job: any) => {
                console.log(`[Worker] Job ${job.id} completed`);
            });

            worker.on('failed', (job: any, err: any) => {
                console.error(`[Worker] Job ${job?.id} failed:`, err);
            });

            console.log('[Worker] BullMQ Worker started inside main bot process');
        } catch (workerErr) {
            console.error('[Worker] Failed to start BullMQ Worker:', workerErr);
        }

        console.log('[Ready] Bot is now online and listening to events.');

        // Initialize captcha pool
        try {
            await captchaPool.refillPool();
            console.log('[Bot] Captcha pool dolduruldu');
        } catch (err) {
            console.error('[Bot] Failed to refill captcha pool:', err);
        }

        // Sync Servers with API
        const syncServers = async (retries = 5, delay = 2000) => {
            console.log(`[Sync] Starting synchronization for ${client.guilds.cache.size} servers...`);

            const serverPayloads = [];

            for (const [id, guild] of client.guilds.cache) {
                try {
                    // Optimized Data Collection
                    // Use approximate counts if available in cache, otherwise fallback to standard props
                    // Note: guild.approximateMemberCount requires Intent `Guilds` and specific fetching strategy if not cached

                    const activeMemberCount = guild.members.cache.filter(m =>
                        m.presence?.status !== 'offline' && m.presence?.status !== undefined
                    ).size;

                    // Voice Analytics via VoiceStates
                    const voiceStates = guild.voiceStates.cache;
                    const voiceMemberCount = voiceStates.size;
                    const streamingMemberCount = voiceStates.filter(vs => !!vs.streaming).size;
                    const videoMemberCount = voiceStates.filter(vs => !!vs.selfVideo).size;
                    const normalVoiceMemberCount = Math.max(0, voiceMemberCount - streamingMemberCount - videoMemberCount);

                    serverPayloads.push({
                        id: guild.id,
                        name: guild.name,
                        ownerId: guild.ownerId,
                        icon: guild.iconURL({ extension: 'png', size: 1024 }) || undefined,
                        banner: guild.bannerURL({ extension: 'png', size: 2048 }) || undefined,
                        memberCount: guild.memberCount, // guild.memberCount is usually accurate
                        description: guild.description || undefined,
                        categories: ['Community'],

                        // Metrics
                        activeMemberCount: activeMemberCount || 0,
                        voiceMemberCount: voiceMemberCount || 0,
                        streamingMemberCount: streamingMemberCount || 0,
                        videoMemberCount: videoMemberCount || 0,
                        normalVoiceMemberCount: normalVoiceMemberCount || 0,
                        roleCount: guild.roles.cache.size || 0,
                        emojiCount: guild.emojis.cache.size || 0,
                        stickerCount: guild.stickers.cache.size || 0,
                        boostCount: guild.premiumSubscriptionCount || 0,

                        // Data
                        emojis: guild.emojis.cache.map((emoji) => ({
                            emojiId: emoji.id,
                            name: emoji.name || 'Unknown',
                            url: emoji.imageURL() || '',
                            animated: emoji.animated || false,
                        })),
                        stickers: guild.stickers.cache.map((sticker) => ({
                            stickerId: sticker.id,
                            name: sticker.name,
                            url: sticker.url,
                            format: sticker.format.toString(),
                        })),
                    });

                } catch (error) {
                    console.error(`[Sync] Error processing guild ${guild.name}:`, error);
                }
            }

            if (serverPayloads.length > 0) {
                const chunkSize = 10;
                let successCount = 0;

                for (let i = 0; i < serverPayloads.length; i += chunkSize) {
                    const chunk = serverPayloads.slice(i, i + chunkSize);
                    let chunkSuccess = false;

                    for (let attempt = 1; attempt <= retries; attempt++) {
                        try {
                            const apiUrl = process.env.API_URL ?? 'http://127.0.0.1:3001/api';
                            const response = await fetch(`${apiUrl}/servers/sync`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-bot-secret': process.env.BOT_SECRET || ''
                                },
                                body: JSON.stringify({ servers: chunk })
                            });

                            if (response.ok) {
                                successCount += chunk.length;
                                chunkSuccess = true;
                                break; // Chunk başarılı, döngüden çık
                            } else {
                                console.error(`[Sync] Failed to batch sync chunk (Attempt ${attempt}): ${await response.text()}`);
                            }
                        } catch (error) {
                            console.error(`[Sync] Network error on chunk (Attempt ${attempt}/${retries}):`, error);
                        }

                        if (!chunkSuccess && attempt < retries) {
                            console.log(`[Sync] Retrying chunk in ${delay / 1000}s...`);
                            await new Promise(res => setTimeout(res, delay));
                        }
                    }

                    if (!chunkSuccess) {
                        console.error('[Sync] All retry attempts failed for current chunk.');
                    }
                }
                
                console.log(`[Sync] Successfully synced ${successCount}/${serverPayloads.length} servers in batches.`);
            }

            console.log('[Sync] Synchronization complete.');
        };

        // Run sync
        syncServers();
    },
});