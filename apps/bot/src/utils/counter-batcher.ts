// Lightweight batcher for high-frequency counter updates (voiceState, member counts, etc.)
// Collects updates in memory and flushes to API periodically.
// Uses optimistic locking (version field) to prevent stale overwrites.
import { apiClient } from './api-client';
import { PrismaClient } from '@prisma/client';

interface CounterUpdate {
    serverId: string;
    memberCount?: number;
    activeMemberCount?: number;
    channelCount?: number;
    voiceChannelCount?: number;
    roleCount?: number;
    emojiCount?: number;
    stickerCount?: number;
    boostCount?: number;
    voiceMemberCount?: number;
    streamingMemberCount?: number;
    videoMemberCount?: number;
    normalVoiceMemberCount?: number;
    updatedAt: number; // Date.now() — used to resolve merge conflicts
}

class CounterBatcher {
    private pending = new Map<string, CounterUpdate>();
    private timer: ReturnType<typeof setInterval> | null = null;
    private flushIntervalMs: number;
    private prisma: PrismaClient;
    private shuttingDown = false;

    constructor(flushIntervalMs = 15_000) {
        this.flushIntervalMs = flushIntervalMs;
        this.prisma = new PrismaClient();

        // Flush before shutdown
        process.on('SIGTERM', () => this.handleShutdown());
        process.on('SIGINT', () => this.handleShutdown());
    }

    /** Add a counter update — merges with existing pending, respects timestamps */
    add(update: Omit<CounterUpdate, 'updatedAt'> & { updatedAt?: number }): void {
        const stamped: CounterUpdate = { ...update, updatedAt: update.updatedAt ?? Date.now() };
        const existing = this.pending.get(stamped.serverId);

        if (existing) {
            // Only merge fields from the newer update
            if (stamped.updatedAt >= existing.updatedAt) {
                Object.assign(existing, stamped);
            }
        } else {
            this.pending.set(stamped.serverId, stamped);
        }

        if (!this.timer) {
            this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
        }
    }

    /** Immediately send pending updates to API with version-checked retry */
    async flush(): Promise<void> {
        if (this.pending.size === 0) return;

        const updates = Array.from(this.pending.values());
        this.pending.clear();

        try {
            // Read current versions for optimistic locking
            const serverIds = updates.map((u) => u.serverId);
            const servers = await this.prisma.server.findMany({
                where: { id: { in: serverIds } },
                select: { id: true, version: true },
            });
            const versionMap = new Map(servers.map((s: { id: string; version: number }) => [s.id, s.version]));

            const versionedUpdates = updates.map((u) => ({
                ...u,
                version: versionMap.get(u.serverId) ?? 0,
            } as CounterUpdate & { version: number }));

            const result = await apiClient.batchUpdateCounters(versionedUpdates);

            // If some updates failed due to version mismatch, re-add for retry
            if (result.failedIds && result.failedIds.length > 0) {
                const failedSet = new Set(result.failedIds);
                for (const u of updates) {
                    if (failedSet.has(u.serverId)) {
                        this.reAdd(u);
                    }
                }
            }
        } catch (err) {
            console.error('[CounterBatcher] Flush failed:', err);
            for (const u of updates) {
                this.reAdd(u);
            }
        }
    }

    private reAdd(update: CounterUpdate): void {
        const existing = this.pending.get(update.serverId);
        if (existing) {
            if (update.updatedAt >= existing.updatedAt) {
                Object.assign(existing, update);
            }
        } else {
            this.pending.set(update.serverId, { ...update });
        }
    }

    /** Stop the batcher and flush remaining */
    async stop(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        await this.flush();
    }

    private async handleShutdown(): Promise<void> {
        if (this.shuttingDown) return;
        this.shuttingDown = true;
        console.log('[CounterBatcher] SIGTERM received, flushing pending updates...');
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        await this.flush();
        await this.prisma.$disconnect();
        process.exit(0);
    }
}

export const counterBatcher = new CounterBatcher();
