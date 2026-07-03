// Passport JWT strategy: validates Bearer tokens and extracts RequestUser from payload
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { RequestUser } from '../interfaces/request-user.interface.js';
import { RedisCacheService } from '../services/redis-cache.service.js';

interface JwtPayload {
    sub: string;
    discordId: string;
    jti?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly redis: RedisCacheService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || configService.getOrThrow<string>('AUTH_SECRET'),
            algorithms: ['HS256'],
        });
    }

    async validate(payload: JwtPayload): Promise<RequestUser> {
        if (payload.jti) {
            const blacklisted = await this.redis.get(`blacklist:jwt:${payload.jti}`);
            if (blacklisted) throw new UnauthorizedException('Token has been revoked');
        }
        return {
            userId: payload.sub,
            discordId: payload.discordId,
        };
    }
}
