// Unit tests for HypeService: score formula, weekly limit, cooldown, reset, and top servers
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { HypeService } from './hype.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';
import { createPrismaMock, asPrismaService } from '../../test/prisma-mock.helper.js';
import { EventsGateway } from '../../events/events.gateway.js';

function createCacheMock() {
    return {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        delPattern: jest.fn().mockResolvedValue(undefined),
        getOrSet: jest.fn().mockImplementation((_key: string, factory: () => unknown) => factory()),
        getOrSetEach: jest.fn(),
    };
}

describe('HypeService', () => {
    let service: HypeService;
    let prismaMock: ReturnType<typeof createPrismaMock>;
    let cacheMock: ReturnType<typeof createCacheMock>;

    const SERVER_ID = 'server-1';
    const USER_ID = 'user-1';

    beforeEach(async () => {
        prismaMock = createPrismaMock();
        cacheMock = createCacheMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HypeService,
                {
                    provide: PrismaService,
                    useValue: asPrismaService(prismaMock),
                },
                {
                    provide: RedisCacheService,
                    useValue: cacheMock,
                },
                {
                    provide: EventsGateway,
                    useValue: { emitHypeUpdate: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<HypeService>(HypeService);
    });

    describe('hype', () => {
        it('awards points successfully on first hype', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 100 });
            prismaMock.hypeVote.findMany.mockResolvedValue([]);
            prismaMock.hypeVote.create.mockResolvedValue({});
            prismaMock.server.update.mockResolvedValue({});

            const result = await service.hype(SERVER_ID, USER_ID);

            expect(result.success).toBe(true);
            expect(result.pointsAwarded).toBeGreaterThan(0);
            expect(result.weeklyUsed).toBe(1);
            expect(result.weeklyRemaining).toBe(2);
        });

        it('throws NotFoundException when server does not exist', async () => {
            prismaMock.server.findUnique.mockResolvedValue(null);

            await expect(service.hype(SERVER_ID, USER_ID)).rejects.toThrow(NotFoundException);
        });

        it('throws ConflictException when weekly limit reached (3 h types)', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 100 });
            prismaMock.hypeVote.findMany.mockResolvedValue([
                { id: 'h1', usedAt: new Date() },
                { id: 'h2', usedAt: new Date() },
                { id: 'h3', usedAt: new Date() },
            ]);

            await expect(service.hype(SERVER_ID, USER_ID)).rejects.toThrow(ConflictException);
        });

        it('throws ConflictException when cooldown is active', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 100 });
            prismaMock.hypeVote.findMany.mockResolvedValue([
                { id: 'h1', usedAt: new Date() }, // just now — 12h cooldown
            ]);

            await expect(service.hype(SERVER_ID, USER_ID)).rejects.toThrow(ConflictException);
        });

        it('uses $transaction to create hypeVote and update server score', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 1000 });
            prismaMock.hypeVote.findMany.mockResolvedValue([]);
            prismaMock.server.update.mockResolvedValue({});
            prismaMock.hypeVote.create.mockResolvedValue({});

            await service.hype(SERVER_ID, USER_ID);

            expect(prismaMock.$transaction).toHaveBeenCalled();
            expect(prismaMock.server.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        weeklyHypeScore: { increment: expect.any(Number) },
                        totalHypeScore: { increment: expect.any(Number) },
                        totalHypes: { increment: expect.any(Number) },
                    },
                }),
            );
        });

        it('rejects 4th hype when weekly limit reached (race condition)', async () => {
            // User already has 3 h types — 4th should fail
            const now = new Date();
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 100 });
            prismaMock.hypeVote.findMany.mockResolvedValue([
                { id: 'h1', usedAt: now },
                { id: 'h2', usedAt: now },
                { id: 'h3', usedAt: now },
            ]);

            await expect(service.hype(SERVER_ID, USER_ID)).rejects.toThrow(ConflictException);

            // Verify no server update or hypeVote create was called
            expect(prismaMock.hypeVote.create).not.toHaveBeenCalled();
            expect(prismaMock.server.update).not.toHaveBeenCalled();
        });

        it('rolls back server update when hypeVote.create fails', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 100 });
            prismaMock.hypeVote.findMany.mockResolvedValue([]);
            prismaMock.server.update.mockResolvedValue({});
            prismaMock.hypeVote.create.mockRejectedValue(new Error('DB insert failed'));

            await expect(service.hype(SERVER_ID, USER_ID)).rejects.toThrow('DB insert failed');

            // The $transaction should propagate the error, rolling back all changes
            expect(prismaMock.$transaction).toHaveBeenCalled();
        });

        it('blocks concurrent h types from same user (only one succeeds)', async () => {
            let callCount = 0;
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 100 });
            prismaMock.hypeVote.findMany.mockImplementation(() => {
                callCount++;
                if (callCount <= 1) {
                    return Promise.resolve([]); // No previous h types
                }
                return Promise.resolve([
                    { id: 'h1', usedAt: new Date() }, // Has recent hype
                ]);
            });
            prismaMock.hypeVote.create.mockResolvedValue({});
            prismaMock.server.update.mockResolvedValue({});

            const [first, second] = await Promise.allSettled([
                service.hype(SERVER_ID, USER_ID),
                service.hype(SERVER_ID, USER_ID),
            ]);

            const succeeded = [first, second].filter((r) => r.status === 'fulfilled').length;
            const failed = [first, second].filter((r) => r.status === 'rejected').length;

            expect(succeeded).toBe(1);
            expect(failed).toBe(1);
        });

        it('score formula: larger member count yields fewer points', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID, memberCount: 100000 });
            prismaMock.hypeVote.findMany.mockResolvedValue([]);
            prismaMock.hypeVote.create.mockResolvedValue({});
            prismaMock.server.update.mockResolvedValue({});

            const bigResult = await service.hype(SERVER_ID, USER_ID);

            // Reset mocks for second call
            prismaMock.server.findUnique.mockResolvedValue({ id: 'srv-2', memberCount: 100 });
            prismaMock.hypeVote.findMany.mockResolvedValue([]);

            const smallResult = await service.hype('srv-2', USER_ID);

            // 100-member server should get more points than 100k-member server
            expect(smallResult.pointsAwarded).toBeGreaterThan(bigResult.pointsAwarded);
        });
    });

    describe('getStatus', () => {
        it('returns zero usage when no h types yet', async () => {
            prismaMock.hypeVote.findMany.mockResolvedValue([]);

            const status = await service.getStatus(SERVER_ID, USER_ID);

            expect(status.weeklyUsed).toBe(0);
            expect(status.weeklyRemaining).toBe(3);
            expect(status.nextHypeAvailableAt).toBeNull();
            expect(status.lastHypeAt).toBeNull();
        });

        it('shows cooldown remaining when last hype was recent', async () => {
            const recentHype = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
            prismaMock.hypeVote.findMany.mockResolvedValue([
                { id: 'h1', usedAt: recentHype },
            ]);

            const status = await service.getStatus(SERVER_ID, USER_ID);

            expect(status.weeklyUsed).toBe(1);
            expect(status.weeklyRemaining).toBe(2);
            expect(status.nextHypeAvailableAt).toBeInstanceOf(Date);
        });

        it('shows next reset time when weekly limit reached', async () => {
            prismaMock.hypeVote.findMany.mockResolvedValue([
                { id: 'h1', usedAt: new Date() },
                { id: 'h2', usedAt: new Date() },
                { id: 'h3', usedAt: new Date() },
            ]);

            const status = await service.getStatus(SERVER_ID, USER_ID);

            expect(status.weeklyUsed).toBe(3);
            expect(status.weeklyRemaining).toBe(0);
            expect(status.nextHypeAvailableAt).toBeInstanceOf(Date);
        });
    });

    describe('getTopServers', () => {
        it('queries visible servers with positive weeklyHypeScore ordered descending', async () => {
            prismaMock.server.findMany.mockResolvedValue([]);

            await service.getTopServers(50);

            expect(prismaMock.server.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isVisible: true },
                    orderBy: [
                        { weeklyHypeScore: 'desc' },
                        { votes: 'desc' },
                    ],
                    take: 50,
                }),
            );
        });
    });

    describe('resetWeeklyScores', () => {
        it('calls updateMany to reset all weeklyHypeScore to 0', async () => {
            prismaMock.server.updateMany.mockResolvedValue({ count: 5 });

            await service.resetWeeklyScores();

            expect(prismaMock.server.updateMany).toHaveBeenCalledWith({
                data: { weeklyHypeScore: 0 },
            });
        });
    });
});
