import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminServersService } from './admin-servers.service.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminBotService } from './admin-bot.service.js';
import { AdminSystemService } from './admin-system.service.js';
import { AdminGuard } from './admin.guard.js';
import { PrismaService } from '../../common/services/prisma.service.js';

@Module({
    imports: [
        // ConfigModule required for AdminGuard to inject ConfigService
        ConfigModule,
    ],
    controllers: [AdminController],
    providers: [
        AdminService,
        AdminServersService,
        AdminUsersService,
        AdminBotService,
        AdminSystemService,
        AdminGuard,
        PrismaService,
    ],
    exports: [AdminService],
})
export class AdminModule {}

