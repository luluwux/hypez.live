// Validates x-bot-secret header against BOT_SECRET env var for bot-only endpoints
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCompare } from '../utils/crypto.js';

interface BotRequest {
    headers: Record<string, string | undefined>;
}

@Injectable()
export class BotGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<BotRequest>();
        const incoming = request.headers['x-bot-secret'];
        const expected = this.configService.getOrThrow<string>('BOT_SECRET');

        if (!incoming || !safeCompare(incoming, expected)) {
            throw new ForbiddenException('Invalid bot secret');
        }

        return true;
    }
}
