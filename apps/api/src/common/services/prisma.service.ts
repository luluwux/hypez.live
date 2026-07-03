import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({ name: 'PrismaService' });

// Prisma 6 removed $use middleware. Retry logic is applied via $extends in withRetry().
// The class itself stays a plain PrismaClient for NestJS DI compatibility.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
        logger.info('Database connected successfully');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    private isRetriableError(error: unknown): boolean {
        const retriableCodes = ['P2024', 'P1001', 'P1002', 'P1008', 'P1017'];
        if (error && typeof error === 'object' && 'code' in error) {
            const code = (error as { code: unknown }).code;
            if (typeof code === 'string' && retriableCodes.includes(code)) return true;
        }
        if (error instanceof Error) {
            if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
                return true;
            }
        }
        return false;
    }

    async withRetry<T>(operation: () => Promise<T>, attempts = 3, baseDelay = 1000): Promise<T> {
        let lastError: unknown;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (!this.isRetriableError(error) || attempt === attempts) {
                    throw error;
                }
                const delay = baseDelay * Math.pow(2, attempt - 1);
                logger.warn({ attempt, delay }, 'Retrying database operation');
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
}
