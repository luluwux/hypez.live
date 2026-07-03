// Leaderboard endpoints: top servers by voice, members, votes (Redis-backed with DB fallback)
import { Controller, Get, Query, ParseIntPipe, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { LeaderboardService } from './leaderboard.service.js';
import { ServersService } from './servers.service.js';
import { ServerSummaryDto } from './dto/server-summary.dto.js';

@ApiTags('Leaderboard')
@Controller('servers/top')
export class LeaderboardController {
    constructor(
        private readonly leaderboardService: LeaderboardService,
        private readonly serversService: ServersService,
    ) { }

    @Get('voice')
    @SkipThrottle()
    @Header('Cache-Control', 'public, max-age=60')
    @ApiOperation({ summary: 'Get top servers by voice activity' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of servers (max 100)' })
    @ApiResponse({ status: 200, description: 'Returns top servers by voice activity', type: [ServerSummaryDto] })
    async getTopByVoice(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number): Promise<any[]> {
        const topLimit = Math.min(limit || 100, 100);

        const serverIds = await this.leaderboardService.getTopByVoice(topLimit);

        // Redis boşsa doğrudan DB'den çek — isPremium boost olmadan sadece gerçek metriğe göre
        if (serverIds.length === 0) {
            return this.serversService.findTopByMetric('voice', topLimit);
        }

        return this.serversService.findByIds(serverIds);
    }

    @Get('members')
    @SkipThrottle()
    @Header('Cache-Control', 'public, max-age=300')
    @ApiOperation({ summary: 'Get top servers by member count' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of servers (max 100)' })
    @ApiResponse({ status: 200, description: 'Returns top servers by member count', type: [ServerSummaryDto] })
    async getTopByMembers(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number): Promise<any[]> {
        const topLimit = Math.min(limit || 100, 100);

        const serverIds = await this.leaderboardService.getTopByMembers(topLimit);

        if (serverIds.length === 0) {
            return this.serversService.findTopByMetric('members', topLimit);
        }

        return this.serversService.findByIds(serverIds);
    }

    @Get('votes')
    @SkipThrottle()
    @Header('Cache-Control', 'public, max-age=60')
    @ApiOperation({ summary: 'Get top servers by votes' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of servers (max 100)' })
    @ApiResponse({ status: 200, description: 'Returns top servers by votes', type: [ServerSummaryDto] })
    async getTopByVotes(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number): Promise<any[]> {
        const topLimit = Math.min(limit || 100, 100);

        const serverIds = await this.leaderboardService.getTopByVotes(topLimit);

        if (serverIds.length === 0) {
            return this.serversService.findTopByMetric('votes', topLimit);
        }

        return this.serversService.findByIds(serverIds);
    }
}
