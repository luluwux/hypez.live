// Vote module: provides and exports VoteService
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoteService } from './vote.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';

@Module({
    imports: [ConfigModule],
    providers: [VoteService, PrismaService],
    exports: [VoteService],
})
export class VoteModule {}
