// Servers feature module: wires controllers, services, and VoteModule dependency
import { Module } from '@nestjs/common';
import { ServersController } from './servers.controller.js';
import { ServersService } from './servers.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { LeaderboardService } from './leaderboard.service.js';
import { LeaderboardController } from './leaderboard.controller.js';
import { CategoriesController } from './categories.controller.js';
import { VoteModule } from '../votes/vote.module.js';
import { EventsModule } from '../../events/events.module.js';
import { PremiumExpiryCron } from './premium-expiry.cron.js';

@Module({
    imports: [VoteModule, EventsModule],
    controllers: [ServersController, LeaderboardController, CategoriesController],
    providers: [ServersService, PrismaService, LeaderboardService, PremiumExpiryCron],
    exports: [LeaderboardService],
})
export class ServersModule {}
