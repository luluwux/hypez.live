import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService, AuthTokenPayload } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: jest.Mocked<Pick<JwtService, 'sign' | 'verify'>>;

    const TEST_SECRET = 'test-jwt-secret';
    const VALID_PAYLOAD: AuthTokenPayload = {
        sub: 'user-123',
        discordId: '123456789',
        role: 'USER',
        premiumLevel: 1,
    };

    beforeEach(async () => {
        jwtService = {
            sign: jest.fn().mockReturnValue('mocked-jwt-token-string'),
            verify: jest.fn().mockReturnValue({ ...VALID_PAYLOAD }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });
    describe('signToken', () => {
        it('calls JwtService.sign with the payload', () => {
            service.signToken(VALID_PAYLOAD);
            expect(jwtService.sign).toHaveBeenCalledWith(VALID_PAYLOAD);
        });

        it('returns the signed token string', () => {
            const token = service.signToken(VALID_PAYLOAD);
            expect(token).toBe('mocked-jwt-token-string');
        });

        it('includes discordId claim in payload', () => {
            const payload: AuthTokenPayload = {
                sub: 'u-1',
                discordId: '999888777',
                role: 'USER',
                premiumLevel: 0,
            };
            service.signToken(payload);
            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ discordId: '999888777' }),
            );
        });

        it('includes role claim in payload', () => {
            const payload: AuthTokenPayload = {
                sub: 'u-2',
                discordId: '111',
                role: 'ADMIN',
                premiumLevel: 2,
            };
            service.signToken(payload);
            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'ADMIN' }),
            );
        });

        it('includes premiumLevel claim', () => {
            service.signToken(VALID_PAYLOAD);
            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ premiumLevel: 1 }),
            );
        });
    });
    describe('verifyToken', () => {
        it('calls JwtService.verify with the token', () => {
            service.verifyToken('some-token');
            expect(jwtService.verify).toHaveBeenCalledWith('some-token');
        });

        it('returns decoded payload on valid token', () => {
            const payload = service.verifyToken('valid-token');
            expect(payload.sub).toBe('user-123');
            expect(payload.discordId).toBe('123456789');
            expect(payload.role).toBe('USER');
        });

        it('propagates JwtService.verify errors for invalid tokens', () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('jwt malformed');
            });

            expect(() => service.verifyToken('bad-token')).toThrow('jwt malformed');
        });

        it('propagates token expiration errors', () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('jwt expired');
            });

            expect(() => service.verifyToken('expired-token')).toThrow('jwt expired');
        });
    });
});
