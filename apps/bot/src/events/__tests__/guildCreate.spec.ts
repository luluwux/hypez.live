// Unit tests for guildCreate event handler — verifies API sync payload correctness
import { Events, ChannelType } from 'discord.js';

// Mock apiClient before importing the event handler
const mockSyncServer = jest.fn().mockResolvedValue({ id: 'guild-123' });

jest.mock('../../utils/api-client', () => ({
    apiClient: {
        syncServer: mockSyncServer,
        fetchActiveCategories: jest.fn().mockResolvedValue([]),
    },
    BotApiClient: jest.fn(),
    __esModule: true,
}));

jest.mock('../services/webhook-logger', () => ({
    logGuildJoin: jest.fn(),
    logGuildJoinChannel: jest.fn().mockResolvedValue(undefined),
}));

// Import after mocks are set up
import guildCreateEvent from '../guildCreate';

function mockCollection<T>(entries: Array<[string, T]> = []) {
    const map = new Map(entries);
    return Object.assign(map, {
        map: <R>(fn: (item: T, key: string) => R): R[] => {
            const result: R[] = [];
            for (const [key, value] of map) {
                result.push(fn(value, key));
            }
            return result;
        },
        filter: (fn: (item: T, key: string) => boolean) => {
            const filtered: Array<[string, T]> = [];
            for (const [key, value] of map) {
                if (fn(value, key)) {
                    filtered.push([key, value]);
                }
            }
            return mockCollection(filtered);
        },
        // Needed by createPermanentInvite inside guildCreate.ts
        find: (fn: (item: T, key: string) => boolean): T | undefined => {
            for (const [key, value] of map) {
                if (fn(value, key)) return value;
            }
            return undefined;
        },
    });
}

function buildMockGuild(overrides: Record<string, unknown> = {}) {
    // 15 GuildText channels so textChannels.size === 15 (matching channelCount assertion)
    const channelEntries = Array.from(
        { length: 15 },
        (_, i) => [`channel-${i}`, { type: ChannelType.GuildText }] as [string, { type: number }],
    );

    return {
        id: '123456789',
        name: 'Test Guild',
        description: 'A test server',
        ownerId: 'owner-001',
        memberCount: 250,
        approximatePresenceCount: 120,
        premiumSubscriptionCount: 4,
        iconURL: jest.fn().mockReturnValue('https://cdn.discord.com/icons/123/icon.png'),
        bannerURL: jest.fn().mockReturnValue('https://cdn.discord.com/banners/123/banner.png'),
        fetch: jest.fn().mockResolvedValue(undefined),
        // members.me = null → createPermanentInvite early-returns null (no invite error)
        members: { me: null },
        // Must use mockCollection so .filter() is available (guildCreate.ts separates text vs voice channels)
        channels: { cache: mockCollection(channelEntries) },
        // size=8 is sufficient; guildCreate.ts only reads .size, never calls .filter on roles
        roles: { cache: { size: 8 } },
        emojis: {
            cache: mockCollection([
                ['1', { id: 'emoji-1', name: 'Smile', imageURL: () => 'https://emoji1.png', animated: false }],
                ['2', { id: 'emoji-2', name: 'Party', imageURL: () => 'https://emoji2.gif', animated: true }],
            ]),
        },
        stickers: {
            cache: mockCollection([
                ['3', { id: 'sticker-1', name: 'Wave', url: 'https://sticker1.png', format: { toString: () => 'PNG' } }],
            ]),
        },
        voiceStates: {
            cache: mockCollection(),
        },
        ...overrides,
    };
}

describe('guildCreate event', () => {
    beforeEach(() => {
        mockSyncServer.mockClear();
    });

    it('sends correct sync payload to API when guild is joined', async () => {
        const guild = buildMockGuild();
        await guildCreateEvent.execute({} as any, guild as any);

        expect(mockSyncServer).toHaveBeenCalledTimes(1);

        const payload = mockSyncServer.mock.calls[0][0];
        expect(payload.id).toBe('123456789');
        expect(payload.name).toBe('Test Guild');
        expect(payload.description).toBe('A test server');
        expect(payload.ownerId).toBe('owner-001');
        expect(payload.memberCount).toBe(250);
        expect(payload.activeMemberCount).toBe(120);
        expect(payload.boostCount).toBe(4);
        expect(payload.channelCount).toBe(15);
        expect(payload.roleCount).toBe(8);
    });

    it('includes emoji data in the sync payload', async () => {
        const guild = buildMockGuild();
        await guildCreateEvent.execute({} as any, guild as any);

        const payload = mockSyncServer.mock.calls[0][0];
        expect(payload.emojis).toHaveLength(2);
        expect(payload.emojiCount).toBe(2);
        expect(payload.emojis[0]).toEqual({
            emojiId: 'emoji-1',
            name: 'Smile',
            url: 'https://emoji1.png',
            animated: false,
        });
    });

    it('includes sticker data in the sync payload', async () => {
        const guild = buildMockGuild();
        await guildCreateEvent.execute({} as any, guild as any);

        const payload = mockSyncServer.mock.calls[0][0];
        expect(payload.stickers).toHaveLength(1);
        expect(payload.stickerCount).toBe(1);
        expect(payload.stickers[0]).toEqual({
            stickerId: 'sticker-1',
            name: 'Wave',
            url: 'https://sticker1.png',
            format: 'PNG',
        });
    });

    it('handles missing icon gracefully', async () => {
        const guild = buildMockGuild();
        (guild.iconURL as jest.Mock).mockReturnValue('');
        await guildCreateEvent.execute({} as any, guild as any);

        const payload = mockSyncServer.mock.calls[0][0];
        expect(payload.icon).toBe('');
    });

    it('handles null description gracefully', async () => {
        const guild = buildMockGuild({ description: null });
        await guildCreateEvent.execute({} as any, guild as any);

        const payload = mockSyncServer.mock.calls[0][0];
        expect(payload.description).toBeNull();
    });

    it('does not crash when API call fails', async () => {
        mockSyncServer.mockRejectedValueOnce(new Error('API down'));
        const guild = buildMockGuild();

        // Should not throw — error is caught and logged
        await expect(
            guildCreateEvent.execute({} as any, guild as any),
        ).resolves.toBeUndefined();
    });

    it('computes voice state counts correctly', async () => {
        const guild = buildMockGuild({
            voiceStates: {
                cache: mockCollection([
                    ['1', { streaming: true, selfVideo: false }],
                    ['2', { streaming: false, selfVideo: true }],
                    ['3', { streaming: false, selfVideo: false }],
                ]),
            },
        });
        await guildCreateEvent.execute({} as any, guild as any);

        const payload = mockSyncServer.mock.calls[0][0];
        expect(payload.voiceMemberCount).toBe(3);
        expect(payload.streamingMemberCount).toBe(1);
        expect(payload.videoMemberCount).toBe(1);
        expect(payload.normalVoiceMemberCount).toBe(1);
    });
});
