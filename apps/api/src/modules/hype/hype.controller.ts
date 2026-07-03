import { Controller, Post, Get, Param, Query, Body, HttpCode, HttpStatus, UseGuards, Header } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { HypeService } from './hype.service.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { BotGuard } from '../../common/guards/bot.guard.js';

export class HypeBodyDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{17,20}$/, { message: 'userId must be a valid Discord snowflake ID' })
    userId: string;
}

@ApiTags('hype')
@Controller('hype')
export class HypeController {
    constructor(private readonly hypeService: HypeService) {}

    @Post(':serverId')
    @Public()
    @UseGuards(BotGuard)
    @Throttle({ short: { ttl: 60000, limit: 3 } })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Hype a server (called by bot after captcha validation)' })
    async hype(
        @Param('serverId') serverId: string,
        @Body() body: HypeBodyDto,
    ) {
        return this.hypeService.hype(serverId, body.userId);
    }

    @Get(':serverId/status')
    @SkipThrottle()
    @Public()
    @ApiOperation({ summary: 'Get hype status for a user on a server' })
    async getStatus(
        @Param('serverId') serverId: string,
        @Query('userId') userId: string,
    ) {
        if (!userId) {
            return { message: 'userId query parameter is required' };
        }
        return this.hypeService.getStatus(serverId, userId);
    }

    @Get('top')
    @SkipThrottle()
    @Public()
    @Header('Cache-Control', 'public, max-age=60')
    @ApiOperation({ summary: 'Get top hyped servers this week (weekly leaderboard)' })
    async getTop(@Query('limit') limit?: string) {
        const parsedLimit = Math.min(parseInt(limit ?? '100', 10) || 100, 100);
        return this.hypeService.getTopServers(parsedLimit);
    }
}
