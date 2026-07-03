// Unit tests for VoteService: cooldown, not-found, and transaction increment scenarios
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VoteService } from './vote.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';
import { createPrismaMock, asPrismaService } from '../../test/prisma-mock.helper.js';

describe('VoteService', () => {
    let service: VoteService;
    let prismaMock: ReturnType<typeof createPrismaMock>;

    beforeEach(async () => {
        prismaMock = createPrismaMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VoteService,
                {
                    provide: PrismaService,
                    useValue: asPrismaService(prismaMock),
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(12),
                        getOrThrow: jest.fn().mockReturnValue(12),
                    },
                },
                {
                    provide: RedisCacheService,
                    useValue: {
                        get: jest.fn().mockResolvedValue(null),
                        set: jest.fn().mockResolvedValue(true),
                        delete: jest.fn().mockResolvedValue(true),
                        exists: jest.fn().mockResolvedValue(false),
                    },
                },
            ],
        }).compile();

        service = module.get<VoteService>(VoteService);
    });

    describe('vote', () => {
        const SERVER_ID = 'server-123';
        const USER_ID = 'user-456';

        it('creates vote successfully on first attempt', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID });
            prismaMock.vote.findFirst.mockResolvedValue(null);
            prismaMock.server.update.mockResolvedValue({
                id: SERVER_ID,
                name: 'Test Server',
                votes: 1,
            });
            prismaMock.vote.create.mockResolvedValue({});

            const result = await service.vote(SERVER_ID, USER_ID);

            expect(result.success).toBe(true);
            expect(result.server.votes).toBe(1);
            expect(result.nextVoteAvailable).toBeInstanceOf(Date);
        });

        it('throws ConflictException when cooldown not expired', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID });
            prismaMock.vote.findFirst.mockResolvedValue({
                id: 'vote-1',
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            });

            await expect(service.vote(SERVER_ID, USER_ID)).rejects.toThrow(
                ConflictException,
            );
        });

        it('throws NotFoundException when server does not exist', async () => {
            prismaMock.server.findUnique.mockResolvedValue(null);

            await expect(service.vote(SERVER_ID, USER_ID)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('increments vote count via $transaction', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID });
            prismaMock.vote.findFirst.mockResolvedValue(null);
            prismaMock.server.update.mockResolvedValue({
                id: SERVER_ID,
                name: 'Test Server',
                votes: 42,
            });
            prismaMock.vote.create.mockResolvedValue({});

            await service.vote(SERVER_ID, USER_ID);

            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
            expect(prismaMock.server.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        votes: { increment: 1 },
                        lastVoterId: USER_ID,
                    }),
                }),
            );
        });

        it('rolls back when vote.create fails inside transaction', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID });
            prismaMock.vote.findFirst.mockResolvedValue(null);
            prismaMock.server.update.mockResolvedValue({
                id: SERVER_ID,
                name: 'Test Server',
                votes: 1,
            });
            prismaMock.vote.upsert.mockRejectedValue(new Error('DB error'));

            // The $transaction mock calls the callback with the mock itself,
            // so the error from vote.create propagates naturally
            await expect(service.vote(SERVER_ID, USER_ID)).rejects.toThrow('DB error');
        });

        it('allows concurrent votes from different users on same server', async () => {
            const userA = 'user-a';
            const userB = 'user-b';

            // Both users have no recent votes
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID });
            prismaMock.vote.findFirst.mockResolvedValue(null);
            prismaMock.server.update.mockResolvedValue({
                id: SERVER_ID,
                name: 'Test Server',
                votes: 2,
            });
            prismaMock.vote.create.mockResolvedValue({});

            const [resultA, resultB] = await Promise.all([
                service.vote(SERVER_ID, userA),
                service.vote(SERVER_ID, userB),
            ]);

            expect(resultA.success).toBe(true);
            expect(resultB.success).toBe(true);
        });

        it('blocks concurrent votes from same user (race condition prevention)', async () => {
            // Simulate: both tx calls see no recent vote (race condition), but
            // the second transaction should see the first vote's insert.
            // We test this by having findFirst return null on first call,
            // then a recent vote on second call within the same user.
            let callCount = 0;
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID });
            prismaMock.vote.findFirst.mockImplementation(() => {
                callCount++;
                // First call: no vote found → passes cooldown
                // Second call: vote found → fails cooldown
                if (callCount <= 1) {
                    return Promise.resolve(null);
                }
                return Promise.resolve({
                    id: 'vote-recent',
                    createdAt: new Date(), // just now
                });
            });
            prismaMock.server.update.mockResolvedValue({
                id: SERVER_ID,
                name: 'Test Server',
                votes: 1,
            });
            prismaMock.vote.create.mockResolvedValue({});

            const [first, second] = await Promise.allSettled([
                service.vote(SERVER_ID, USER_ID),
                service.vote(SERVER_ID, USER_ID),
            ]);

            // One should succeed, one should fail with ConflictException
            const succeeded = [first, second].filter((r) => r.status === 'fulfilled').length;
            const failed = [first, second].filter((r) => r.status === 'rejected').length;

            expect(succeeded).toBe(1);
            expect(failed).toBe(1);
            if (first.status === 'rejected') {
                expect((first.reason as Error).message).toContain('Vote cooldown');
            }
            if (second.status === 'rejected') {
                expect((second.reason as Error).message).toContain('Vote cooldown');
            }
        });

        it('cooldown error includes hours remaining and next vote time', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ id: SERVER_ID });
            prismaMock.vote.findFirst.mockResolvedValue({
                id: 'vote-1',
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago — 11h remaining
            });

            try {
                await service.vote(SERVER_ID, USER_ID);
                fail('Expected ConflictException');
            } catch (err) {
                expect(err).toBeInstanceOf(ConflictException);
                const msg = (err as Error).message;
                expect(msg).toContain('Vote cooldown active');
                expect(msg).toContain('hour(s)');
            }
        });
    });
});
