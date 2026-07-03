// Centralized API client for bot-to-backend communication.
// All writes go through this client instead of direct Prisma access.
import { FALLBACK_CATEGORIES } from '@hypez/shared-types';
import type { Category } from '@hypez/shared-types';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3001/api';
const BOT_SECRET = process.env.BOT_SECRET || '';
interface SyncServerPayload {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    banner?: string | null;
    ownerId?: string;
    memberCount?: number;
    activeMemberCount?: number;
    channelCount?: number;
    roleCount?: number;
    emojiCount?: number;
    stickerCount?: number;
    boostCount?: number;
    voiceMemberCount?: number;
    streamingMemberCount?: number;
    videoMemberCount?: number;
    normalVoiceMemberCount?: number;
    voiceChannelCount?: number;
    categories?: string[];
    badges?: string[];
    locale?: string;
    inviteUrl?: string | null;
    leaderboardChannelId?: string | null;
    leaderboardMessageId?: string | null;
    emojis?: EmojiData[];
    stickers?: StickerData[];
    version?: number;
    isVisible?: boolean;
}

interface EmojiData {
    emojiId: string;
    name: string;
    url: string;
    animated: boolean;
}

interface StickerData {
    stickerId: string;
    name: string;
    url: string;
    format: string;
}

interface CounterUpdate {
    serverId: string;
    memberCount?: number;
    activeMemberCount?: number;
    channelCount?: number;
    roleCount?: number;
    emojiCount?: number;
    stickerCount?: number;
    boostCount?: number;
    voiceMemberCount?: number;
    streamingMemberCount?: number;
    videoMemberCount?: number;
    normalVoiceMemberCount?: number;
    voiceChannelCount?: number;
}

class BotApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public body?: unknown,
    ) {
        super(`API ${status}: ${message}`);
        this.name = 'BotApiError';
    }
}

export class BotApiClient {
    private baseUrl: string;
    private secret: string;

    constructor(baseUrl?: string, secret?: string) {
        this.baseUrl = baseUrl || API_URL;
        this.secret = secret || BOT_SECRET;
    }

    private async request<T = unknown>(
        method: string,
        path: string,
        body?: unknown,
        retries = 3,
        delay = 1000,
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;

        for (let attempt = 1; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30_000);

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bot-secret': this.secret,
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}));
                    const isTransient = response.status >= 500 || response.status === 408 || response.status === 429;

                    if (isTransient && attempt < retries) {
                        console.warn(`[BotApiClient] Request failed with status ${response.status}. Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        delay *= 2;
                        continue;
                    }

                    throw new BotApiError(
                        response.status,
                        (errBody as { message?: string })?.message || response.statusText,
                        errBody,
                    );
                }

                const json = await response.json();
                return (json.data ?? json) as T;
            } catch (error) {
                clearTimeout(timeout);

                const isAbort = (error as Error).name === 'AbortError';
                const isNetworkError = error instanceof TypeError;
                const isTransient = isAbort || isNetworkError;

                if (isTransient && attempt < retries) {
                    console.warn(`[BotApiClient] Request encountered transient error: ${(error as Error).message}. Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= 2;
                    continue;
                }

                if (error instanceof BotApiError) throw error;
                if (isAbort) {
                    throw new BotApiError(408, 'API request timed out');
                }
                throw error;
            }
        }
        throw new Error('Request failed after max retries');
    }

    /** Full server sync (guildCreate) — includes emoji & sticker data */
    async syncServer(payload: SyncServerPayload): Promise<{ id: string }> {
        return this.request('POST', '/servers/sync', { servers: [payload] });
    }

    /** Batch sync multiple servers */
    async syncBatch(payloads: SyncServerPayload[]): Promise<{ count: number }> {
        return this.request('POST', '/servers/sync', { servers: payloads });
    }

    /** Partial update (guildUpdate, counters, etc.) — bot-only endpoint, no ownership check */
    async updateServer(id: string, data: Partial<SyncServerPayload>): Promise<{ id: string }> {
        return this.request('PATCH', `/servers/${id}/bot`, data);
    }

    /** Delete a server (guildDelete) — bot-only endpoint */
    async deleteServer(id: string): Promise<void> {
        return this.request('DELETE', `/servers/${id}/bot`);
    }

    /** Batch emoji sync */
    async syncEmojis(serverId: string, emojis: EmojiData[]): Promise<{ count: number }> {
        return this.request('POST', `/servers/${serverId}/emojis/sync`, { emojis });
    }

    /** Batch sticker sync */
    async syncStickers(serverId: string, stickers: StickerData[]): Promise<{ count: number }> {
        return this.request('POST', `/servers/${serverId}/stickers/sync`, { stickers });
    }

    /** Batch counter updates with optimistic locking (version-checked) */
    async batchUpdateCounters(updates: (CounterUpdate & { version?: number })[]): Promise<{ count: number; failedIds: string[] }> {
        return this.request('POST', '/servers/sync/counters', { counters: updates });
    }

    /** Submit a hype for a server (called after local captcha validation) */
    async submitHype(serverId: string, userId: string): Promise<{
        success: boolean;
        pointsAwarded: number;
        weeklyUsed: number;
        weeklyRemaining: number;
        nextHypeAvailableAt: string | null;
    }> {
        return this.request('POST', `/hype/${serverId}`, { userId });
    }

    /** Submit a vote for a server (called after local captcha validation) */
    async submitVote(serverId: string, userId: string, username?: string, avatarUrl?: string | null): Promise<{
        server: { id: string; name: string; votes: number };
        nextVoteAvailable: string;
    }> {
        return this.request('POST', `/servers/${serverId}/bot-vote`, { userId, username, avatarUrl });
    }

    /** Validate a captcha answer (public endpoint, no bot secret needed but works with it) */
    async validateCaptcha(captchaId: string, answer: string, userId: string, guildId: string): Promise<{
        success: boolean;
        server?: { id: string; name: string; votes: number };
        nextVoteAvailable?: string;
        warning?: string;
    }> {
        return this.request('POST', '/verification/captcha/validate', {
            id: captchaId,
            answer,
            userId,
            guildId,
        });
    }

    /**
     * Sadece captcha cevabını doğrular — oy oluşturmaz.
     * Hype akışında kullanılır: captcha geçtikten sonra ayrıca /hype/:serverId çağrılır.
     * Bu sayede hype limiti doluyken istemeden oy kaydedilmez.
     */
    async validateCaptchaOnly(captchaId: string, answer: string, userId: string): Promise<{ valid: boolean }> {
        return this.request('POST', '/verification/captcha/validate-only', {
            id: captchaId,
            answer,
            userId,
        });
    }

    /** Request a captcha challenge */
    async requestChallenge(userId: string): Promise<{
        id: string;
        imageBase64: string;
        options: string[];
    }> {
        return this.request('POST', '/verification/captcha/request-challenge', { userId });
    }

    /** Send periodic stats snapshot to the ingestion pipeline */
    async sendStats(stats: {
        serverId: string;
        memberCount: number;
        activeMemberCount: number;
        voiceCount?: number;
        messageCount?: number;
    }): Promise<{ success: boolean; message: string }> {
        return this.request('POST', '/ingestion/stats', stats);
    }

    /** Fetch active categories from DB (public endpoint, no bot secret needed) */
    async fetchActiveCategories(): Promise<Category[]> {
        try {
            const url = `${this.baseUrl}/categories`;
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!response.ok) return FALLBACK_CATEGORIES;
            const data = await response.json();
            const list: unknown[] = Array.isArray(data) ? data : (data?.data ?? []);
            if (list.length === 0) return FALLBACK_CATEGORIES;
            return list as Category[];
        } catch {
            return FALLBACK_CATEGORIES;
        }
    }
}

// Singleton instance
export const apiClient = new BotApiClient();

export { BotApiError };
