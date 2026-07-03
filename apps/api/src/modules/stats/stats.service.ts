import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) {}

    /** Get stats for the last 24 hours */
    async getRecentStats(serverId: string, hours = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        return this.prisma.serverStats.findMany({
            where: { serverId, recordedAt: { gte: since } },
            orderBy: { recordedAt: 'asc' },
            select: {
                id: true,
                voiceCount: true,
                messageCount: true,
                recordedAt: true,
            },
        });
    }

    /** Get the latest stat snapshot for a server */
    async getLatestStats(serverId: string) {
        return this.prisma.serverStats.findFirst({
            where: { serverId },
            orderBy: { recordedAt: 'desc' },
            select: {
                id: true,
                voiceCount: true,
                messageCount: true,
                recordedAt: true,
            },
        });
    }
}
