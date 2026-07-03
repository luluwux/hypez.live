// Unit tests for VerificationService: session creation, challenge modes, verify, expiry
jest.mock('@napi-rs/canvas', () => ({
    createCanvas: jest.fn(() => ({
        getContext: jest.fn(() => ({
            fillRect: jest.fn(),
            fillText: jest.fn(),
        })),
        toBuffer: jest.fn(() => Buffer.from('')),
    })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service.js';
import { MathCaptchaService } from './math-captcha.service.js';
import { VoteService } from '../votes/vote.service.js';
import { LeaderboardService } from '../servers/leaderboard.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { createPrismaMock, asPrismaService } from '../../test/prisma-mock.helper.js';

import { getQueueToken } from '@nestjs/bullmq';

describe('VerificationService', () => {
    let service: VerificationService;
    let prismaMock: ReturnType<typeof createPrismaMock>;
    let mathCaptchaMock: { generate: jest.Mock };
    let voteServiceMock: { vote: jest.Mock };
    let leaderboardServiceMock: { updateVoteRank: jest.Mock };
    let leaderboardQueueMock: { add: jest.Mock; getJob: jest.Mock };

    const USER_ID = 'user-1';
    const SERVER_ID = 'server-1';

    const VOTE_RESULT = {
        success: true,
        server: { id: SERVER_ID, name: 'Test', votes: 1 },
        nextVoteAvailable: new Date(Date.now() + 12 * 3600_000),
    };

    beforeEach(async () => {
        prismaMock = createPrismaMock();
        mathCaptchaMock = {
            generate: jest.fn().mockReturnValue({
                answer: 42,
                options: [42, 35, 50, 28, 63],
                imageBuffer: Buffer.from('fake-image'),
            }),
        };
        voteServiceMock = {
            vote: jest.fn().mockResolvedValue(VOTE_RESULT),
        };
        leaderboardServiceMock = {
            updateVoteRank: jest.fn().mockResolvedValue(undefined),
        };
        leaderboardQueueMock = {
            add: jest.fn(),
            getJob: jest.fn().mockResolvedValue(null),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VerificationService,
                {
                    provide: PrismaService,
                    useValue: asPrismaService(prismaMock),
                },
                {
                    provide: MathCaptchaService,
                    useValue: mathCaptchaMock,
                },
                {
                    provide: VoteService,
                    useValue: voteServiceMock,
                },
                {
                    provide: LeaderboardService,
                    useValue: leaderboardServiceMock,
                },
                {
                    provide: getQueueToken('leaderboard-update'),
                    useValue: leaderboardQueueMock,
                },
            ],
        }).compile();

        service = module.get<VerificationService>(VerificationService);
    });

    describe('createSession', () => {
        it('creates a verification session with challenge data', async () => {
            prismaMock.verificationSession.create.mockResolvedValue({
                id: 'session-1',
                mode: 'VISUAL',
                status: 'PENDING',
            });

            const result = await service.createSession(USER_ID, SERVER_ID);

            expect(result.sessionId).toBe('session-1');
            expect(result.challenge).toBeDefined();
            expect(['MATH_IMAGE', 'EMOJI', 'COLOR']).toContain(result.challenge.type);
            expect(result.url).toContain('/verify/session-1');
            expect(prismaMock.verificationSession.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId: USER_ID,
                        serverId: SERVER_ID,
                        status: 'PENDING',
                        expiresAt: expect.any(Date),
                    }),
                }),
            );
        });
    });

    describe('getSession', () => {
        it('returns session by id', async () => {
            const session = { id: 'session-1', status: 'PENDING' };
            prismaMock.verificationSession.findUnique.mockResolvedValue(session);

            const result = await service.getSession('session-1');

            expect(result).toBe(session);
            expect(prismaMock.verificationSession.findUnique).toHaveBeenCalledWith({
                where: { id: 'session-1' },
            });
        });
    });

    describe('verifySession', () => {
        const mockSession = (overrides: Record<string, unknown> = {}) =>
            prismaMock.verificationSession.findUnique.mockResolvedValue({
                id: 'session-1',
                userId: USER_ID,
                serverId: SERVER_ID,
                mode: 'VISUAL',
                status: 'PENDING',
                challengeData: {
                    type: 'MATH_IMAGE',
                    question: 'What is 6 × 7?',
                    answer: '42',
                    options: ['42', '35', '50', '28', '63'],
                    imageBase64: 'base64...',
                },
                expiresAt: new Date(Date.now() + 300_000), // 5 min from now
                ...overrides,
            });

        it('verifies correct MATH_IMAGE answer', async () => {
            mockSession();
            prismaMock.verificationSession.update.mockResolvedValue({});
            leaderboardQueueMock.getJob.mockResolvedValue(null);

            const result = await service.verifySession('session-1', '42');

            expect(result.success).toBe(true);
            expect(result.server).toBeDefined();
            expect(voteServiceMock.vote).toHaveBeenCalledWith(SERVER_ID, USER_ID);
        });

        it('throws error for incorrect answer', async () => {
            mockSession();

            await expect(
                service.verifySession('session-1', '999'),
            ).rejects.toThrow('Incorrect answer');
        });

        it('throws error when session not found', async () => {
            prismaMock.verificationSession.findUnique.mockResolvedValue(null);

            await expect(
                service.verifySession('session-1', '42'),
            ).rejects.toThrow('Session not found');
        });

        it('throws error when session already processed', async () => {
            mockSession({ status: 'VERIFIED' });

            await expect(
                service.verifySession('session-1', '42'),
            ).rejects.toThrow('Session already processed');
        });

        it('throws error when session expired', async () => {
            mockSession({ expiresAt: new Date(Date.now() - 60_000) }); // 1 min ago

            await expect(
                service.verifySession('session-1', '42'),
            ).rejects.toThrow('Session expired');
        });

        it('marks session as EXPIRED on expiry', async () => {
            mockSession({ expiresAt: new Date(Date.now() - 60_000) });
            prismaMock.verificationSession.update.mockResolvedValue({});

            await expect(
                service.verifySession('session-1', '42'),
            ).rejects.toThrow('Session expired');

            expect(prismaMock.verificationSession.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'session-1' },
                    data: { status: 'EXPIRED' },
                }),
            );
        });

        it('queues leaderboard update on successful verification', async () => {
            mockSession();
            prismaMock.verificationSession.update.mockResolvedValue({});
            leaderboardQueueMock.getJob.mockResolvedValue(null);

            await service.verifySession('session-1', '42');

            expect(leaderboardQueueMock.add).toHaveBeenCalledWith(
                'update-image',
                { guildId: SERVER_ID },
                expect.objectContaining({
                    delay: 5 * 60 * 1000,
                }),
            );
        });

        it('verifies correct EMOJI answer', async () => {
            mockSession({
                challengeData: {
                    type: 'EMOJI',
                    question: 'Click the Fruit emoji',
                    answer: '🍎',
                    options: ['🚗', '🍎', '⚽', '🎸', '🏢'],
                },
            });

            prismaMock.verificationSession.update.mockResolvedValue({});
            leaderboardQueueMock.getJob.mockResolvedValue(null);

            const result = await service.verifySession('session-1', '🍎');

            expect(result.success).toBe(true);
        });

        it('verifies correct COLOR answer', async () => {
            mockSession({
                challengeData: {
                    type: 'COLOR',
                    question: 'Click the BLUE button!',
                    answer: 'BLUE',
                    options: ['BLUE', 'RED', 'GREEN', 'GRAY'],
                },
            });

            prismaMock.verificationSession.update.mockResolvedValue({});
            leaderboardQueueMock.getJob.mockResolvedValue(null);

            const result = await service.verifySession('session-1', 'BLUE');

            expect(result.success).toBe(true);
        });
    });
});
