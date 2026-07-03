// Unit tests for JwtAuthGuard: public bypass, missing token, and valid token paths
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

function buildMockContext(metadata: Record<string, unknown> = {}): ExecutionContext {
    return {
        getHandler: jest.fn().mockReturnValue(function mockHandler() {}),
        getClass: jest.fn().mockReturnValue(class MockClass {}),
        switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({ headers: {} }),
        }),
    } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;
    let configService: ConfigService;

    beforeEach(() => {
        reflector = new Reflector();
        configService = {
            get: jest.fn().mockReturnValue('test-secret'),
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
        } as unknown as ConfigService;
        guard = new JwtAuthGuard(reflector, configService);
    });

    it('passes through @Public() routes without token', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
        const ctx = buildMockContext();

        const result = guard.canActivate(ctx);

        expect(result).toBe(true);
    });

    it('throws UnauthorizedException when no token provided', () => {
        const ctx = buildMockContext();
        expect(() => guard.handleRequest<null>(null, null, null, ctx)).toThrow(
            UnauthorizedException,
        );
    });

    it('throws UnauthorizedException when error is passed', () => {
        const ctx = buildMockContext();
        expect(() =>
            guard.handleRequest<null>(new Error('token expired'), null, null, ctx),
        ).toThrow(UnauthorizedException);
    });

    it('calls super.canActivate for protected routes with valid token', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

        const superCanActivate = jest
            .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
            .mockReturnValue(true);

        const ctx = buildMockContext();
        guard.canActivate(ctx);

        expect(superCanActivate).toHaveBeenCalledWith(ctx);
    });
});
