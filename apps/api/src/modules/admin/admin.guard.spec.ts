import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';

function mockContext(headers: Record<string, string | undefined>): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => ({ headers }),
        }),
    } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
    let guard: AdminGuard;
    let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;

    const VALID_KEY = 'sk-admin-secret-123';

    beforeEach(() => {
        configService = {
            getOrThrow: jest.fn().mockReturnValue(VALID_KEY),
        };
        guard = new AdminGuard(configService as ConfigService);
    });

    describe('canActivate', () => {
        it('passes with valid x-admin-key header', () => {
            const ctx = mockContext({ 'x-admin-key': VALID_KEY });
            expect(guard.canActivate(ctx)).toBe(true);
        });

        it('passes with valid x-api-key header (backward compat)', () => {
            const ctx = mockContext({ 'x-api-key': VALID_KEY });
            expect(guard.canActivate(ctx)).toBe(true);
        });

        it('throws UnauthorizedException when key is wrong', () => {
            const ctx = mockContext({ 'x-admin-key': 'wrong-key' });
            expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when header is missing', () => {
            const ctx = mockContext({});
            expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when key is an empty string', () => {
            const ctx = mockContext({ 'x-admin-key': '' });
            expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
        });

        it('reads valid key from ConfigService.getOrThrow', () => {
            const ctx = mockContext({ 'x-admin-key': VALID_KEY });
            guard.canActivate(ctx);
            expect(configService.getOrThrow).toHaveBeenCalledWith('ADMIN_API_KEY');
        });

        it('rejects keys case-sensitively', () => {
            const ctx = mockContext({ 'x-admin-key': VALID_KEY.toUpperCase() });
            // only rejects if the keys don't match; if VALID_KEY is already uppercase this test is a no-op
            if (VALID_KEY !== VALID_KEY.toUpperCase()) {
                expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
            }
        });
    });
});
