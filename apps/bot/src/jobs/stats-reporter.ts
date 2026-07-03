// Periodic stats reporter: gathers guild metrics every 5 minutes and sends to the API ingestion pipeline
import { Client } from 'discord.js';
import { apiClient } from '../utils/api-client';
import { popMessageCount } from '../utils/message-counter';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Mutex: prevents concurrent execution of the same report cycle.
// If a previous cycle is still running when the interval fires, the new one is skipped.
let isRunning = false;

let intervalHandle: NodeJS.Timeout | null = null;

async function report(client: Client): Promise<void> {
    if (isRunning) {
        console.warn('[StatsReporter] Previous cycle still running — skipping this tick.');
        return;
    }

    isRunning = true;
    console.log(`[StatsReporter] Collecting stats for ${client.guilds.cache.size} guilds...`);
    let sent = 0;
    let failed = 0;

    try {
        for (const [, guild] of client.guilds.cache) {
            try {
                const voiceStates = guild.voiceStates.cache;
                const voiceCount = voiceStates.size;

                // Count active members (non-offline presence)
                const activeCount = guild.members.cache.filter(
                    m => m.presence?.status !== 'offline' && m.presence?.status !== undefined,
                ).size;

                const messageCount = popMessageCount(guild.id);

                await apiClient.sendStats({
                    serverId: guild.id,
                    memberCount: guild.memberCount,
                    activeMemberCount: activeCount,
                    voiceCount,
                    messageCount,
                });
                sent++;
            } catch (err) {
                failed++;
                console.error(`[StatsReporter] Failed for guild ${guild.id}:`, err);
            }
        }

        console.log(`[StatsReporter] Done — sent: ${sent}, failed: ${failed}`);
    } finally {
        // Always release the mutex, even if an error occurs
        isRunning = false;
    }
}

export function startStatsReporter(client: Client): NodeJS.Timeout {
    console.log(`[StatsReporter] Starting periodic stats reporting every ${INTERVAL_MS / 1000}s`);

    // Fire immediately, then on interval
    report(client).catch(err => console.error('[StatsReporter] Initial report failed:', err));

    intervalHandle = setInterval(() => {
        report(client).catch(err => console.error('[StatsReporter] Interval report failed:', err));
    }, INTERVAL_MS);

    return intervalHandle;
}

/** Call during graceful shutdown to stop the reporter interval. */
export function stopStatsReporter(): void {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        console.log('[StatsReporter] Interval stopped.');
    }
}
