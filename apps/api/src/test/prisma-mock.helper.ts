// Factory that returns a jest mock of PrismaService for unit tests
import { PrismaService } from '../common/services/prisma.service.js';

type PrismaMock = {
    server: {
        findUnique: jest.Mock;
        findMany: jest.Mock;
        count: jest.Mock;
        update: jest.Mock;
        updateMany: jest.Mock;
        create: jest.Mock;
        upsert: jest.Mock;
        delete: jest.Mock;
    };
    user: {
        findUnique: jest.Mock;
        upsert: jest.Mock;
    };
    vote: {
        findFirst: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        groupBy: jest.Mock;
        upsert: jest.Mock;
    };
    hypeVote: {
        findMany: jest.Mock;
        create: jest.Mock;
    };
    auditLog: {
        findMany: jest.Mock;
        create: jest.Mock;
    };
    verificationSession: {
        create: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
    };
    account: {
        findFirst: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    $transaction: jest.Mock;
    $queryRawUnsafe: jest.Mock;
};

export function createPrismaMock(): PrismaMock {
    const mock: PrismaMock = {
        server: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            create: jest.fn(),
            upsert: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findUnique: jest.fn().mockResolvedValue(null),
            upsert: jest.fn(),
        },
        vote: {
            findFirst: jest.fn(),
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
            groupBy: jest.fn().mockResolvedValue([]),
            upsert: jest.fn(),
        },
        hypeVote: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
        },
        auditLog: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
        },
        verificationSession: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        account: {
            findFirst: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $transaction: jest.fn(),
        $queryRawUnsafe: jest.fn(),
    };

    // $transaction calls the callback with the mock itself
    mock.$transaction.mockImplementation(
        (cbOrOps: ((tx: PrismaMock) => Promise<unknown>) | unknown[]) => {
            if (typeof cbOrOps === 'function') {
                return cbOrOps(mock);
            }
            return Promise.all(cbOrOps as Promise<unknown>[]);
        },
    );

    return mock;
}

export type { PrismaMock };

// Re-export as a partial PrismaService type for injection in tests
export function asPrismaService(mock: PrismaMock): PrismaService {
    return mock as unknown as PrismaService;
}
