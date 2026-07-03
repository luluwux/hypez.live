// AdminGuard: validates x-admin-key header against ADMIN_API_KEY env var.
// Uses ConfigService for DI-friendly config access (avoids raw process.env).
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCompare } from '../../common/utils/crypto.js';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();

        // Accept both header names for backward compatibility
        const incomingKey = request.headers['x-admin-key'] ?? request.headers['x-api-key'];
        const validKey = this.configService.getOrThrow<string>('ADMIN_API_KEY');

        if (!incomingKey || !safeCompare(incomingKey, validKey)) {
            throw new UnauthorizedException('Invalid admin credentials');
        }

        return true;
    }
}
