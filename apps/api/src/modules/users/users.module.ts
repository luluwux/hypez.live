import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { RedisCacheModule } from '../../common/services/redis-cache.module.js';

@Module({
    imports: [RedisCacheModule],
    controllers: [UsersController],
    providers: [UsersService, PrismaService],
})
export class UsersModule {}
