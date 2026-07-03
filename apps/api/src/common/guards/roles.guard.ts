// Checks @Roles() metadata against req.user.role; allows through if no metadata is set
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'ROLES';
export const Roles = (...roles: string[]): ReturnType<typeof SetMetadata> =>
    SetMetadata(ROLES_KEY, roles);

interface AuthedRequest {
    user?: { role?: string };
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthedRequest>();
        const userRole = request.user?.role;

        if (!userRole || !requiredRoles.includes(userRole)) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
