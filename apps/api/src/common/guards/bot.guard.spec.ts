import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotGuard } from './bot.guard';

function mockContext(headers: Record<string, string | undefined>): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => ({ headers }),
        }),
    } as unknown as ExecutionContext;
}

describe('BotGuard', () => {
    let guard: BotGuard;
    let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;

    const VALID_SECRET = 'bot-secret-xyz';

    beforeEach(() => {
        configService = {
            getOrThrow: jest.fn().mockReturnValue(VALID_SECRET),
        };
        guard = new BotGuard(configService as ConfigService);
    });

    describe('canActivate', () => {
        it('passes with valid x-bot-secret header', () => {
            const ctx = mockContext({ 'x-bot-secret': VALID_SECRET });
            expect(guard.canActivate(ctx)).toBe(true);
        });

        it('throws ForbiddenException when secret is wrong', () => {
            const ctx = mockContext({ 'x-bot-secret': 'wrong' });
            expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
        });

        it('throws ForbiddenException when header is missing', () => {
            const ctx = mockContext({});
            expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
        });

        it('reads secret from ConfigService.getOrThrow BOT_SECRET', () => {
            const ctx = mockContext({ 'x-bot-secret': VALID_SECRET });
            guard.canActivate(ctx);
            expect(configService.getOrThrow).toHaveBeenCalledWith('BOT_SECRET');
        });

        it('throws if ConfigService.getOrThrow raises (env var missing)', () => {
            configService.getOrThrow.mockImplementation(() => {
                throw new Error('BOT_SECRET not found');
            });
            const ctx = mockContext({ 'x-bot-secret': 'anything' });

            expect(() => guard.canActivate(ctx)).toThrow('BOT_SECRET not found');
        });

        it('rejects case-sensitively (x-bot-secret header)', () => {
            const ctx = mockContext({ 'x-bot-secret': VALID_SECRET.toUpperCase() });
            if (VALID_SECRET !== VALID_SECRET.toUpperCase()) {
                expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
            }
        });
    });
});
