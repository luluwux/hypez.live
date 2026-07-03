// Unit tests for guildMemberAdd — verifies counterBatcher receives member count updates
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

import guildMemberAddEvent from '../guildMemberAdd';
import { eventThrottle } from '../../utils/event-throttle';

function buildMockMember(overrides: Record<string, unknown> = {}) {
    return {
        guild: {
            id: 'guild-123',
            memberCount: 42,
        },
        ...overrides,
    };
}

describe('guildMemberAdd event', () => {
    beforeEach(() => {
        mockAdd.mockReset();
        (eventThrottle.shouldProcess as jest.Mock).mockReturnValue(true);
    });

    it('queues member count update via counterBatcher', async () => {
        const member = buildMockMember();
        await guildMemberAddEvent.execute({} as any, member as any);

        expect(mockAdd).toHaveBeenCalledTimes(1);
        const update = mockAdd.mock.calls[0][0];
        expect(update.serverId).toBe('guild-123');
        expect(update.memberCount).toBe(42);
    });

    it('sends correct member count after multiple joins', async () => {
        const member1 = buildMockMember({
            guild: { id: 'guild-500', memberCount: 100 },
        });
        const member2 = buildMockMember({
            guild: { id: 'guild-500', memberCount: 101 },
        });

        await guildMemberAddEvent.execute({} as any, member1 as any);
        await guildMemberAddEvent.execute({} as any, member2 as any);

        expect(mockAdd).toHaveBeenCalledTimes(2);
        expect(mockAdd.mock.calls[0][0].memberCount).toBe(100);
        expect(mockAdd.mock.calls[1][0].memberCount).toBe(101);
    });

    it('skips update when throttled', async () => {
        (eventThrottle.shouldProcess as jest.Mock).mockReturnValue(false);

        const member = buildMockMember();
        await guildMemberAddEvent.execute({} as any, member as any);

        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('does not crash when counterBatcher throws', async () => {
        mockAdd.mockImplementation(() => {
            throw new Error('batcher error');
        });

        const member = buildMockMember();
        await expect(
            guildMemberAddEvent.execute({} as any, member as any),
        ).resolves.toBeUndefined();
    });

    it('uses the correct guild ID for different guilds', async () => {
        const memberA = buildMockMember({ guild: { id: 'guild-A', memberCount: 10 } });
        const memberB = buildMockMember({ guild: { id: 'guild-B', memberCount: 20 } });

        await guildMemberAddEvent.execute({} as any, memberA as any);
        await guildMemberAddEvent.execute({} as any, memberB as any);

        expect(mockAdd.mock.calls[0][0].serverId).toBe('guild-A');
        expect(mockAdd.mock.calls[1][0].serverId).toBe('guild-B');
    });
});
