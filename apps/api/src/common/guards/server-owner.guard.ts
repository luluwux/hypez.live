import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../services/prisma.service';
import { safeCompare } from '../utils/crypto';

@Injectable()
export class ServerOwnerGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;
    const serverId = request.params?.serverId || request.params?.id || request.body?.serverId;

    if (!serverId) {
      throw new BadRequestException('Server ID is required');
    }
    const botSecret = request.headers['x-bot-secret'];
    const expectedSecret = this.configService.getOrThrow<string>('BOT_SECRET');
    if (botSecret && expectedSecret && safeCompare(botSecret, expectedSecret)) {
        return true;
    }

    if (!userId) throw new ForbiddenException('User not authenticated');

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { ownerId: true },
    });

    if (!server) throw new NotFoundException('Server not found');
    
    // Check ownership. We assume the user ID inside the DB and the requested JWT matches.
    // Also handling case where user might be discordId (bot scenario).
    if (server.ownerId !== userId && server.ownerId !== request.user?.discordId) {
       throw new ForbiddenException('You do not own this server');
    }

    return true;
  }
}
