// Unit tests for voiceStateUpdate — verifies counterBatcher receives correct voice counts
import { Events } from 'discord.js';

const mockAdd = jest.fn();

jest.mock('../../utils/counter-batcher', () => ({
    counterBatcher: { add: mockAdd },
    __esModule: true,
}));

jest.mock('../../utils/event-throttle', () => ({
    eventThrottle: {
        shouldProcess: jest.fn().mockReturnValue(true),
    },
    __esModule: true,
}));

import voiceStateUpdateEvent from '../voiceStateUpdate';
import { eventThrottle } from '../../utils/event-throttle';

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
    });
}

function buildMockVoiceState(overrides: Record<string, unknown> = {}) {
    return {
        guild: {
            id: 'guild-123',
            voiceStates: {
                cache: mockCollection(),
            },
        },
        channel: null,
        streaming: false,
        selfVideo: false,
        ...overrides,
    };
}

describe('voiceStateUpdate event', () => {
    beforeEach(() => {
        mockAdd.mockReset();
        (eventThrottle.shouldProcess as jest.Mock).mockReturnValue(true);
    });

    it('queues voice counts via counterBatcher when user joins voice', async () => {
        const oldState = buildMockVoiceState({
            channel: null,
        });
        const newState = buildMockVoiceState({
            channel: { id: 'channel-1' },
            guild: {
                id: 'guild-123',
                voiceStates: {
                    cache: mockCollection([
                        ['user1', { streaming: false, selfVideo: false }],
                        ['user2', { streaming: false, selfVideo: false }],
                    ]),
                },
            },
        });

        await voiceStateUpdateEvent.execute({} as any, oldState as any, newState as any);

        expect(mockAdd).toHaveBeenCalledTimes(1);
        const update = mockAdd.mock.calls[0][0];
        expect(update.serverId).toBe('guild-123');
        expect(update.voiceMemberCount).toBe(2);
        expect(update.streamingMemberCount).toBe(0);
        expect(update.videoMemberCount).toBe(0);
        expect(update.normalVoiceMemberCount).toBe(2);
    });

    it('counts streaming and video members separately', async () => {
        const guild = {
            id: 'guild-456',
            voiceStates: {
                cache: mockCollection([
                    ['u1', { streaming: true, selfVideo: false }],
                    ['u2', { streaming: false, selfVideo: true }],
                    ['u3', { streaming: false, selfVideo: false }],
                    ['u4', { streaming: true, selfVideo: true }],
                ]),
            },
        };

        const oldState = buildMockVoiceState({ channel: null });
        const newState = buildMockVoiceState({ channel: { id: 'ch' }, guild });

        await voiceStateUpdateEvent.execute({} as any, oldState as any, newState as any);

        const update = mockAdd.mock.calls[0][0];
        expect(update.voiceMemberCount).toBe(4);
        expect(update.streamingMemberCount).toBe(2);
        expect(update.videoMemberCount).toBe(2);
        expect(update.normalVoiceMemberCount).toBe(1); // u3
    });

    it('uses oldState guild when newState guild is null (user leaves)', async () => {
        const guild = {
            id: 'guild-789',
            voiceStates: { cache: mockCollection() },
        };

        const oldState = buildMockVoiceState({ channel: { id: 'ch' }, guild });
        const newState = buildMockVoiceState({ channel: null, guild: null });

        await voiceStateUpdateEvent.execute({} as any, oldState as any, newState as any);

        expect(mockAdd).toHaveBeenCalledTimes(1);
        expect(mockAdd.mock.calls[0][0].serverId).toBe('guild-789');
        expect(mockAdd.mock.calls[0][0].voiceMemberCount).toBe(0);
    });

    it('returns early when both guilds are null', async () => {
        const oldState = buildMockVoiceState({ guild: null });
        const newState = buildMockVoiceState({ guild: null });

        await voiceStateUpdateEvent.execute({} as any, oldState as any, newState as any);

        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('skips update when throttled', async () => {
        (eventThrottle.shouldProcess as jest.Mock).mockReturnValue(false);

        const guild = {
            id: 'guild-throttled',
            voiceStates: { cache: mockCollection() },
        };
        const oldState = buildMockVoiceState({ channel: null });
        const newState = buildMockVoiceState({ channel: { id: 'ch' }, guild });

        await voiceStateUpdateEvent.execute({} as any, oldState as any, newState as any);

        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('does not crash when counterBatcher throws', async () => {
        mockAdd.mockImplementation(() => {
            throw new Error('batcher error');
        });

        const guild = {
            id: 'guild-err',
            voiceStates: { cache: mockCollection() },
        };
        const oldState = buildMockVoiceState({ channel: null });
        const newState = buildMockVoiceState({ channel: { id: 'ch' }, guild });

        await expect(
            voiceStateUpdateEvent.execute({} as any, oldState as any, newState as any),
        ).resolves.toBeUndefined();
    });
});
