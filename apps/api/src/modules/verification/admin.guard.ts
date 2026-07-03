import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { safeCompare } from '../../common/utils/crypto.js';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
        const adminKey = request.headers['x-admin-key'] ?? request.headers['x-api-key'];
        const validKey = process.env.ADMIN_API_KEY;

        if (!validKey) {
            throw new UnauthorizedException('Admin API key not configured');
        }

        if (!adminKey || !safeCompare(adminKey, validKey)) {
            throw new UnauthorizedException('Invalid admin credentials');
        }

        return true;
    }
}
