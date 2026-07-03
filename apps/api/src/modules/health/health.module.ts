import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../../common/services/prisma.service';
import { LeaderboardService } from '../servers/leaderboard.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [HealthController],
    providers: [PrismaService, LeaderboardService],
})
export class HealthModule { }
