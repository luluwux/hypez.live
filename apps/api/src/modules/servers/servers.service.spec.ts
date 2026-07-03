// Unit tests for ServersService: CRUD, pagination, filtering, and edge cases
import { Test, TestingModule } from '@nestjs/testing';
import { ServersService } from './servers.service.js';
import { VoteService } from '../votes/vote.service.js';
import { LeaderboardService } from './leaderboard.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';
import { createPrismaMock, asPrismaService } from '../../test/prisma-mock.helper.js';
import { FindServersDto } from './dto/find-servers.dto.js';
import { CreateServerDto } from './dto/create-server.dto.js';
import { ServerCategory } from './enums/server-category.enum.js';
import { UpdateServerDto } from './dto/update-server.dto.js';
import { ServerSortField } from '@hypez/shared-types';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

function buildDto(overrides: Partial<FindServersDto> = {}): FindServersDto {
    const dto = new FindServersDto();
    dto.page = 1;
    dto.limit = 20;
    return Object.assign(dto, overrides);
}

const MOCK_SERVER = {
    id: 'srv-1',
    name: 'Test',
    description: null,
    icon: null,
    banner: null,
    memberCount: 100,
    activeMemberCount: 50,
    votes: 10,
    categories: [],
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
};

describe('ServersService.findAll', () => {
    let service: ServersService;
    let prismaMock: ReturnType<typeof createPrismaMock>;

    beforeEach(async () => {
        prismaMock = createPrismaMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServersService,
                {
                    provide: PrismaService,
                    useValue: asPrismaService(prismaMock),
                },
                {
                    provide: VoteService,
                    useValue: { vote: jest.fn() },
                },
                {
                    provide: LeaderboardService,
                    useValue: { updateVoteRank: jest.fn() },
                },
                {
                    provide: RedisCacheService,
                    useValue: createCacheMock(),
                },
                {
                    provide: EventsGateway,
                    useValue: { emitVoteUpdate: jest.fn(), emitHypeUpdate: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<ServersService>(ServersService);
    });

    it('returns paginated response with correct meta', async () => {
        prismaMock.server.findMany.mockResolvedValue([MOCK_SERVER]);
        prismaMock.server.count.mockResolvedValue(45);

        const result = await service.findAll(buildDto({ page: 2, limit: 20 }));

        expect(result.meta.total).toBe(45);
        expect(result.meta.page).toBe(2);
        expect(result.meta.totalPages).toBe(3);
        expect(result.meta.hasNext).toBe(true);
        expect(result.meta.hasPrev).toBe(true);
        expect(result.data).toHaveLength(1);
    });

    it('clamps limit to 100 maximum via DTO validation (returns 100 items when 100 provided)', async () => {
        prismaMock.server.findMany.mockResolvedValue([MOCK_SERVER]);
        prismaMock.server.count.mockResolvedValue(1);

        const result = await service.findAll(buildDto({ limit: 100 }));

        expect(prismaMock.server.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 100 }),
        );
        expect(result.meta.limit).toBe(100);
    });

    it('calls prisma findMany and count in parallel via Promise.all', async () => {
        let findManyResolved = false;
        let countResolved = false;

        prismaMock.server.findMany.mockImplementation(async () => {
            findManyResolved = true;
            return [MOCK_SERVER];
        });

        prismaMock.server.count.mockImplementation(async () => {
            countResolved = true;
            return 1;
        });

        await service.findAll(buildDto());

        expect(findManyResolved).toBe(true);
        expect(countResolved).toBe(true);
        expect(prismaMock.server.findMany).toHaveBeenCalledTimes(1);
        expect(prismaMock.server.count).toHaveBeenCalledTimes(1);
    });

    it('applies category filter when provided', async () => {
        prismaMock.server.findMany.mockResolvedValue([]);
        prismaMock.server.count.mockResolvedValue(0);

        await service.findAll(buildDto({ category: 'Gaming' }));

        expect(prismaMock.server.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    categories: { hasSome: ['Gaming'] },
                }),
            }),
        );
    });

    it('applies search filter when provided', async () => {
        prismaMock.server.findMany.mockResolvedValue([]);
        prismaMock.server.count.mockResolvedValue(0);

        await service.findAll(buildDto({ search: 'Lulushu' }));

        expect(prismaMock.server.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    name: { contains: 'Lulushu', mode: 'insensitive' },
                }),
            }),
        );
    });

    it('applies isPremium=true filter', async () => {
        prismaMock.server.findMany.mockResolvedValue([]);
        prismaMock.server.count.mockResolvedValue(0);

        await service.findAll(buildDto({ isPremium: true }));

        expect(prismaMock.server.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    premiumTier: 'PREMIUM',
                }),
            }),
        );
    });

    it('applies isPremium=false filter', async () => {
        prismaMock.server.findMany.mockResolvedValue([]);
        prismaMock.server.count.mockResolvedValue(0);

        await service.findAll(buildDto({ isPremium: false }));

        expect(prismaMock.server.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    premiumTier: 'NONE',
                }),
            }),
        );
    });

    it('sorts premium servers at the top by default', async () => {
        prismaMock.server.findMany.mockResolvedValue([]);
        prismaMock.server.count.mockResolvedValue(0);

        await service.findAll(buildDto());

        expect(prismaMock.server.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: expect.arrayContaining([
                    { isPremium: 'desc' },
                ]),
            }),
        );
    });

    it('handles RANDOM sort via $queryRawUnsafe', async () => {
        prismaMock.$queryRawUnsafe.mockResolvedValue([]);
        prismaMock.server.count.mockResolvedValue(0);

        await service.findAll(buildDto({ sort: ServerSortField.RANDOM }));

        expect(prismaMock.$queryRawUnsafe).toHaveBeenCalled();
    });
});

describe('ServersService CRUD', () => {
    let service: ServersService;
    let prismaMock: ReturnType<typeof createPrismaMock>;

    beforeEach(async () => {
        prismaMock = createPrismaMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServersService,
                {
                    provide: PrismaService,
                    useValue: asPrismaService(prismaMock),
                },
                {
                    provide: VoteService,
                    useValue: { vote: jest.fn() },
                },
                {
                    provide: LeaderboardService,
                    useValue: { updateVoteRank: jest.fn() },
                },
                {
                    provide: RedisCacheService,
                    useValue: createCacheMock(),
                },
                {
                    provide: EventsGateway,
                    useValue: { emitVoteUpdate: jest.fn(), emitHypeUpdate: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<ServersService>(ServersService);
    });

    describe('create', () => {
        const dto: CreateServerDto = {
            name: 'New Server',
            ownerId: 'owner-1',
            category: ServerCategory.GAMING,
        };

        it('calls prisma.server.create when no id provided', async () => {
            prismaMock.server.create.mockResolvedValue(MOCK_SERVER);

            await service.create(dto, 'owner-1');

            expect(prismaMock.server.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: 'New Server',
                        ownerId: 'owner-1',
                        categories: ['Gaming'],
                    }),
                }),
            );
        });

        it('calls prisma.server.upsert when id provided', async () => {
            prismaMock.server.upsert.mockResolvedValue(MOCK_SERVER);

            await service.create({ ...dto, id: 'srv-99' }, 'owner-1');

            expect(prismaMock.server.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'srv-99' },
                    create: expect.objectContaining({ id: 'srv-99' }),
                }),
            );
        });
    });

    describe('update', () => {
        it('updates server when user is owner', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ ...MOCK_SERVER, ownerId: 'owner-1' });
            prismaMock.server.update.mockResolvedValue(MOCK_SERVER);

            const dto: UpdateServerDto = { name: 'Updated' };
            await service.update('srv-1', dto, 'owner-1');

            expect(prismaMock.server.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'srv-1' },
                    data: { ...dto, version: { increment: 1 } },
                }),
            );
        });

        it('throws ForbiddenException when user is not owner', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ ...MOCK_SERVER, ownerId: 'other-owner' });

            await expect(
                service.update('srv-1', { name: 'Updated' }, 'owner-1'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('throws NotFoundException when server does not exist', async () => {
            prismaMock.server.findUnique.mockResolvedValue(null);

            await expect(
                service.update('srv-99', { name: 'Updated' }, 'owner-1'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('deletes server when user is owner', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ ...MOCK_SERVER, ownerId: 'owner-1' });
            prismaMock.server.delete.mockResolvedValue(MOCK_SERVER);

            await service.remove('srv-1', 'owner-1');

            expect(prismaMock.server.delete).toHaveBeenCalledWith({ where: { id: 'srv-1' } });
        });

        it('throws ForbiddenException when user is not owner', async () => {
            prismaMock.server.findUnique.mockResolvedValue({ ...MOCK_SERVER, ownerId: 'other-owner' });

            await expect(service.remove('srv-1', 'owner-1')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('findOne', () => {
        it('returns server with emojis and stickers included', async () => {
            prismaMock.server.findUnique.mockResolvedValue(MOCK_SERVER);

            const result = await service.findOne('srv-1');

            expect(result).toEqual({ ...MOCK_SERVER, topVoters: [], owner: null });
            expect(prismaMock.server.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'srv-1' },
                    include: expect.objectContaining({
                        emojis: expect.any(Object),
                        stickers: expect.any(Object),
                    }),
                }),
            );
        });

        it('throws NotFoundException when server not found', async () => {
            prismaMock.server.findUnique.mockResolvedValue(null);

            await expect(service.findOne('srv-99')).rejects.toThrow(NotFoundException);
        });
    });

    describe('syncBatch', () => {
        it('passes upsert operations to $transaction', async () => {
            prismaMock.$transaction.mockResolvedValue([]);

            await service.syncBatch([
                { id: 'srv-1', name: 'S1', ownerId: 'o1', category: ServerCategory.GAMING },
                { id: 'srv-2', name: 'S2', ownerId: 'o2', category: ServerCategory.TECHNOLOGY },
            ]);

            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
            const txArg = prismaMock.$transaction.mock.calls[0][0];
            expect(Array.isArray(txArg)).toBe(true);
            expect(txArg).toHaveLength(2);
        });

        it('throws if any server is missing id', async () => {
            await expect(
                service.syncBatch([
                    { name: 'NoID', ownerId: 'o1', category: ServerCategory.GAMING },
                ]),
            ).rejects.toThrow('Server ID is required for sync');
        });
    });
});
