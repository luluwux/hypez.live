import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthTokenPayload {
    sub: string;
    discordId: string;
    role: string;
    premiumLevel: number;
}

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    signToken(payload: AuthTokenPayload): string {
        return this.jwtService.sign(payload);
    }

    verifyToken(token: string): AuthTokenPayload {
        return this.jwtService.verify<AuthTokenPayload>(token);
    }
}
