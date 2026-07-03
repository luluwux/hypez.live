import type { Server, ServerStats, ServerEmoji, ServerSticker, TopVoter, ServerBadge, UserProfile, UpdateProfileDto, IApiResponse, IPaginatedResponse } from '@hypez/shared-types';
export type { Server, ServerStats, ServerEmoji, ServerSticker, TopVoter, ServerBadge, UserProfile, UpdateProfileDto };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';

// Retry helper
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
    throw new Error('Failed after retries');
}

export const api = {
    /**
     * Fetch all servers
     */
    getServers: async (): Promise<Server[]> => {
        try {
            const res = await fetch(`${API_URL}/servers`, { next: { revalidate: 60 } });
            if (!res.ok) throw new Error('Failed to fetch servers');
            const json: IApiResponse<Server[]> | Server[] = await res.json();
            // API response: TransformInterceptor wraps everything in { success, data }
            // ServersService.findAll returns { data: Server[], meta: {...} }
            // So final shape is: { success, data: { data: Server[], meta: {} } }
            const payload = ((json as IApiResponse<Server[]>).data ?? json) as any;
            const servers = payload?.data ?? payload;
            return Array.isArray(servers) ? servers : [];
        } catch {
            if (process.env.NODE_ENV === 'development') console.warn('[API] getServers: API unreachable.');
            return [];
        }
    },

    /**
     * Fetch servers with pagination and sorting
     */
    findServers: async (params: { page?: number; limit?: number; sort?: string; category?: string; language?: string; nsfw?: boolean; search?: string; isPremium?: boolean; ignorePremiumBoost?: boolean } = {}) => {
        try {
            const query = new URLSearchParams();
            if (params.page) query.append('page', params.page.toString());
            if (params.limit) query.append('limit', params.limit.toString());
            if (params.sort) query.append('sort', params.sort);
            if (params.category && params.category !== 'all') query.append('category', params.category);
            if (params.language && params.language !== 'all') query.append('language', params.language);
            if (params.nsfw) query.append('nsfw', 'true');
            if (params.search) query.append('search', params.search);
            if (params.isPremium !== undefined) query.append('isPremium', params.isPremium.toString());
            if (params.ignorePremiumBoost !== undefined) query.append('ignorePremiumBoost', params.ignorePremiumBoost.toString());

            const res = await fetchWithRetry(`${API_URL}/servers?${query.toString()}`, { next: { revalidate: 15 } });
            if (!res.ok) throw new Error('Failed to fetch servers');
            const json: IApiResponse<IPaginatedResponse<Server>> = await res.json();
            const payload = ((json as IApiResponse<IPaginatedResponse<Server>>).data ?? json) as any;
            return {
                data: Array.isArray(payload.data) ? payload.data : [],
                meta: payload.meta || { totalPages: 1 }
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            if (process.env.NODE_ENV === 'development') console.warn('[API] findServers:', message);
            return { data: [], meta: { totalPages: 1 } };
        }
    },

    /**
     * Fetch single server details
     */
    getServer: async (id: string, includeStats = false): Promise<Server | null> => {
        try {
            const query = includeStats ? '?includeStats=true' : '';
            const res = await fetch(`${API_URL}/servers/${id}${query}`, { next: { revalidate: 30 } });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch server');
            const json: IApiResponse<Server> = await res.json();
            return json.data;
        } catch {
            if (process.env.NODE_ENV === 'development') console.warn('[API] getServer: API unreachable.');
            return null;
        }
    },

    /**
     * Vote for a server (Requires Token)
     */
    voteServer: async (id: string, token: string) => {
        const res = await fetch(`${API_URL}/servers/${id}/vote`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to vote');
        }
        return res.json();
    },

    /**
     * Get user's servers (Requires Token)
     */
    getMyServers: async (token: string): Promise<Server[]> => {
        const res = await fetch(`${API_URL}/users/me/servers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch my servers');
        const json: IApiResponse<Server[]> = await res.json();
        return json.data || [];
    },

    /**
     * Fetch newly added servers (sorted by createdAt desc)
     */
    getNewlyAdded: async (limit = 12): Promise<Server[]> => {
        try {
            const res = await fetchWithRetry(
                `${API_URL}/servers?sort=createdAt&limit=${limit}&page=1`,
                { next: { revalidate: 60 } }
            );
            if (!res.ok) throw new Error('Failed to fetch newly added');
            const json: IApiResponse<Server[]> | Server[] = await res.json();
            const payload = ((json as IApiResponse<Server[]>).data ?? json) as any;
            const servers = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
            return servers;
        } catch {
            if (process.env.NODE_ENV === 'development') console.warn('[API] getNewlyAdded: API unreachable.');
            return [];
        }
    },

    /**
     * Fetch top hype servers this week
     */
    getTrendingHype: async (limit = 10): Promise<Server[]> => {
        try {
            const res = await fetchWithRetry(
                `${API_URL}/hype/top?limit=${limit}`,
                { next: { revalidate: 60 } }
            );
            if (!res.ok) throw new Error('Failed to fetch trending hype');
            const json: IApiResponse<Server[]> | Server[] = await res.json();
            const payload = ((json as IApiResponse<Server[]>).data ?? json) as any;
            return Array.isArray(payload) ? payload : [];
        } catch {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[API] getTrendingHype: API unreachable — returning empty list.');
            }
            return [];
        }
    },

    /**
     * Get total member count across all servers
     */
    getTotalMembers: async (): Promise<number> => {
        try {
            const res = await fetchWithRetry(`${API_URL}/servers/total-members`, { next: { revalidate: 300 } });
            if (!res.ok) throw new Error('Failed to fetch total members');
            const json: IApiResponse<number> = await res.json();
            return json.data ?? 0;
        } catch {
            if (process.env.NODE_ENV === 'development') console.warn('[API] getTotalMembers: API unreachable.');
            return 0;
        }
    },

    /**
     * Hype a server (Requires Token)
     */
    hypeServer: async (serverId: string, token: string) => {
        const res = await fetch(`${API_URL}/hype/${serverId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to hype');
        }
        return res.json();
    },

    /**
     * Get hype status for a server (Requires Token)
     */
    getHypeStatus: async (serverId: string, token: string) => {
        const res = await fetch(`${API_URL}/hype/${serverId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to get hype status');
        return res.json();
    },
    // Users
    getUsers: async (): Promise<UserProfile[]> => {
        const res = await fetch(`${API_URL}/users`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        const json: IApiResponse<UserProfile[]> = await res.json();
        return json.data || [];
    },

    getUserProfile: async (id: string, token?: string): Promise<UserProfile | null | 'not_published'> => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_URL}/users/${id}`, { cache: 'no-store', headers });
            if (res.status === 404) return null;
            if (res.status === 403) return 'not_published';
            if (!res.ok) throw new Error('Failed to fetch user profile');
            const json: IApiResponse<UserProfile> = await res.json();
            return json.data ?? json;
        } catch {
            if (process.env.NODE_ENV === 'development') console.warn('[API] getUserProfile: API unreachable.');
            return null;
        }
    },

    getMyProfile: async (token: string): Promise<UserProfile | null> => {
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch my profile');
            const json: IApiResponse<UserProfile> = await res.json();
            return json.data ?? json;
        } catch {
            if (process.env.NODE_ENV === 'development') console.warn('[API] getMyProfile: API unreachable.');
            return null;
        }
    },

    updateProfile: async (data: UpdateProfileDto, token: string) => {
        const res = await fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update profile');
        const json: IApiResponse<UserProfile> = await res.json();
        return json.data ?? json;
    },

    publishProfile: async (token: string) => {
        const res = await fetch(`${API_URL}/users/me/publish`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to publish profile');
        const json: IApiResponse<UserProfile> = await res.json();
        return json.data ?? json;
    },

    recordProfileView: async (id: string, token?: string) => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            await fetch(`${API_URL}/users/${id}/view`, {
                method: 'POST',
                headers,
            });
        } catch { /* fire and forget */ }
    },

    toggleProfileLike: async (id: string, token: string): Promise<{ liked: boolean; likes: number }> => {
        const res = await fetch(`${API_URL}/users/${id}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to toggle like');
        const json: IApiResponse<{ liked: boolean; likes: number }> = await res.json();
        return json.data ?? (json as unknown as { liked: boolean; likes: number });
    },

    redeemPremiumCode: async (code: string, serverId: string, token: string): Promise<{ success: boolean; message: string; premiumExpiresAt: string }> => {
        const res = await fetch(`${API_URL}/users/me/redeem-premium`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, serverId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to redeem premium code');
        return json.data ?? json;
    },
};
