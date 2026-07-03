// Global JWT guard: enforces authentication on protected routes.
// On @Public() routes, silently extracts the user from Bearer token if present
// so that optional-viewer logic (e.g. viewing own unpublished profile) works.
import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { safeCompare } from '../utils/crypto.js';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly reflector: Reflector,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();
        const botSecret = req.headers?.['x-bot-secret'];
        const expectedSecret = this.configService.get<string>('BOT_SECRET');
        if (botSecret && expectedSecret && safeCompare(botSecret, expectedSecret)) {
            return true;
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isPublic) {
            return super.canActivate(context);
        }

        // Public route — attempt JWT extraction if a Bearer token is present,
        // but never fail: unauthenticated access is always allowed.
        const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
        const authHeader = request.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return true;
        }

        const result = super.canActivate(context);
        if (result instanceof Promise) {
            return result.then(() => true).catch(() => true);
        }
        return true;
    }

    handleRequest<TUser>(err: Error | null, user: TUser, _info: unknown, context: ExecutionContext): TUser {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            // On public routes user may be null/undefined — that is intentional.
            return user;
        }

        if (err || !user) {
            throw new UnauthorizedException('Authentication required');
        }
        return user;
    }
}
