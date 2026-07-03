// Auth module: wires PassportModule, JwtModule, JwtStrategy, and JwtAuthGuard
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../common/strategies/jwt.strategy.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                // TODO(hypez): [2026-05-24]  Access token + Refresh token mimarisine geçmeyi değerlendir.
                const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '1d');
                return {
                    secret: configService.getOrThrow<string>('JWT_SECRET'),
                    signOptions: {
                        // Cast needed: @nestjs/jwt v11 expects StringValue from ms package
                        expiresIn: expiresIn as unknown as number,
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [JwtStrategy, JwtAuthGuard, AuthService],
    exports: [JwtModule, JwtAuthGuard, PassportModule, AuthService],
})
export class AuthModule {}
