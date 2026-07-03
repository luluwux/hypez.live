// E2E tests for /servers CRUD flow using supertest with mocked dependencies
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ServersModule } from '../src/modules/servers/servers.module.js';
import { PrismaService } from '../src/common/services/prisma.service.js';
import { VoteService } from '../src/modules/votes/vote.service.js';
import { RedisCacheService } from '../src/common/services/redis-cache.service.js';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotGuard } from '../src/common/guards/bot.guard.js';

describe('ServersController (e2e)', () => {
    let app: INestApplication<App>;
    let prismaMock: {
        server: Record<string, jest.Mock>;
        $transaction: jest.Mock;
    };

    const MOCK_SERVER = {
        id: 'srv-1',
        name: 'Test Server',
        description: 'A test server',
        icon: null,
        banner: null,
        memberCount: 100,
        activeMemberCount: 50,
        votes: 10,
        categories: ['Gaming'],
        premiumTier: 'NONE',
        isPremium: false,
        channelCount: 5,
        roleCount: 3,
        emojiCount: 0,
        stickerCount: 0,
        boostCount: 0,
        voiceMemberCount: 0,
        streamingMemberCount: 0,
        videoMemberCount: 0,
        normalVoiceMemberCount: 0,
        createdAt: new Date(),
        locale: 'en',
        inviteUrl: null,
    };

    beforeAll(async () => {
        prismaMock = {
            server: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                update: jest.fn(),
                create: jest.fn(),
                upsert: jest.fn(),
                delete: jest.fn(),
                updateMany: jest.fn(),
            },
            $transaction: jest.fn(),
        };

        prismaMock.$transaction.mockImplementation(
            (cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock),
        );

        const mockAuthGuard = {
            canActivate: (context: any) => {
                const req = context.switchToHttp().getRequest();
                req.user = { userId: 'user-1', role: 'USER' };
                return true;
            },
        };

        const mockBotGuard = {
            canActivate: () => true,
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true, envFilePath: [] }),
                ServersModule,
            ],
            providers: [
                { provide: APP_GUARD, useValue: mockAuthGuard },
            ],
        })
            .overrideProvider(PrismaService)
            .useValue(prismaMock)
            .overrideProvider(VoteService)
            .useValue({ vote: jest.fn() })
            .overrideGuard(BotGuard)
            .useValue(mockBotGuard)
            .overrideProvider(ConfigService)
            .useValue({
                get: jest.fn().mockReturnValue(12),
                getOrThrow: jest.fn().mockReturnValue(12),
            })
            .overrideProvider(RedisCacheService)
            .useValue({
                get: jest.fn().mockResolvedValue(null),
                set: jest.fn().mockResolvedValue(undefined),
                del: jest.fn().mockResolvedValue(undefined),
                delPattern: jest.fn().mockResolvedValue(undefined),
                getOrSet: jest.fn().mockImplementation((_key: string, factory: () => unknown) => factory()),
                getOrSetEach: jest.fn(),
            })
            .compile();

        app = moduleFixture.createNestApplication(new ExpressAdapter());
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /servers', () => {
        it('returns paginated server list', async () => {
            prismaMock.server.findMany.mockResolvedValue([MOCK_SERVER]);
            prismaMock.server.count.mockResolvedValue(1);

            const res = await request(app.getHttpServer())
                .get('/servers')
                .query({ page: 1, limit: 20 })
                .expect(200);

            expect(res.body.data).toHaveLength(1);
            expect(res.body.meta.total).toBe(1);
            expect(res.body.meta.page).toBe(1);
        });

        it('returns 400 on invalid page', async () => {
            await request(app.getHttpServer())
                .get('/servers')
                .query({ page: -1 })
                .expect(400);
        });
    });

    describe('GET /servers/:id', () => {
        it('returns server by id', async () => {
            prismaMock.server.findUnique.mockResolvedValue(MOCK_SERVER);

            const res = await request(app.getHttpServer())
                .get('/servers/srv-1')
                .expect(200);

            expect(res.body.id).toBe('srv-1');
        });

        it('returns 404 for missing server', async () => {
            prismaMock.server.findUnique.mockResolvedValue(null);

            await request(app.getHttpServer())
                .get('/servers/srv-999')
                .expect(404);
        });
    });

    describe('POST /servers', () => {
        it('creates a new server', async () => {
            prismaMock.server.create.mockResolvedValue(MOCK_SERVER);

            const res = await request(app.getHttpServer())
                .post('/servers')
                .send({
                    name: 'New Server',
                    ownerId: 'owner-1',
                    category: 'Gaming',
                })
                .expect(201);

            expect(prismaMock.server.create).toHaveBeenCalled();
        });

        it('returns 400 on missing required fields', async () => {
            await request(app.getHttpServer())
                .post('/servers')
                .send({ name: 'NoCategory' })
                .expect(400);
        });
    });

    describe('PATCH /servers/:id', () => {
        it('updates a server', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ ...MOCK_SERVER, ownerId: 'user-1' });
            prismaMock.server.update.mockResolvedValue({
                ...MOCK_SERVER,
                name: 'Updated Name',
            });

            const res = await request(app.getHttpServer())
                .patch('/servers/srv-1')
                .send({ name: 'Updated Name' })
                .expect(200);

            expect(res.body.name).toBe('Updated Name');
        });
    });

    describe('DELETE /servers/:id', () => {
        it('deletes a server', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ ...MOCK_SERVER, ownerId: 'user-1' });
            prismaMock.server.delete.mockResolvedValue(MOCK_SERVER);

            await request(app.getHttpServer())
                .delete('/servers/srv-1')
                .expect(200);
        });
    });
});
