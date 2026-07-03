// HTTP layer for server CRUD and voting; public reads, authenticated writes, bot-only sync
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    Header,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServersService } from './servers.service.js';
import { CreateServerDto } from './dto/create-server.dto.js';
import { UpdateServerDto } from './dto/update-server.dto.js';
import { UserUpdateServerDto } from './dto/user-update-server.dto.js';
import { FindServersDto } from './dto/find-servers.dto.js';
import {
    SyncServerDto,
    BatchCounterDto,
    SyncEmojiDto,
    SyncStickerDto,
    SyncServersBatchDto,
    SyncCountersBatchDto,
    SyncEmojisBatchDto,
    SyncStickersBatchDto,
    BotVoteDto,
} from './dto/sync-server.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { BotGuard } from '../../common/guards/bot.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/interfaces/request-user.interface.js';
import { ServerOwnerGuard } from '../../common/guards/server-owner.guard.js';

@ApiTags('Servers')
@ApiBearerAuth()
@Controller('servers')
export class ServersController {
    constructor(private readonly serversService: ServersService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new server' })
    @ApiResponse({ status: 201, description: 'The server has been successfully created.' })
    create(
        @Body() createServerDto: CreateServerDto,
        @CurrentUser() user: RequestUser,
    ) {
        return this.serversService.create(createServerDto, user.discordId);
    }

    @Post('sync')
    @Public()
    @UseGuards(BotGuard)
    @ApiOperation({ summary: 'Batch sync servers with full data (Bot only)' })
    @ApiResponse({ status: 200, description: 'Servers synced successfully.' })
    sync(@Body() body: SyncServersBatchDto) {
        return this.serversService.syncBatchFull(body.servers);
    }

    @Post('sync/counters')
    @Public()
    @UseGuards(BotGuard)
    @HttpCode(200)
    @ApiOperation({ summary: 'Batch counter updates for high-frequency events (Bot only)' })
    batchCounters(@Body() body: SyncCountersBatchDto) {
        return this.serversService.batchUpdateCounters(body.counters);
    }

    @Post(':id/emojis/sync')
    @Public()
    @UseGuards(BotGuard)
    @ApiOperation({ summary: 'Sync emojis for a server (Bot only)' })
    syncEmojis(
        @Param('id') id: string,
        @Body() body: SyncEmojisBatchDto,
    ) {
        return this.serversService.syncEmojis(id, body.emojis);
    }

    @Post(':id/stickers/sync')
    @Public()
    @UseGuards(BotGuard)
    @ApiOperation({ summary: 'Sync stickers for a server (Bot only)' })
    syncStickers(
        @Param('id') id: string,
        @Body() body: SyncStickersBatchDto,
    ) {
        return this.serversService.syncStickers(id, body.stickers);
    }

    @Delete(':id/bot')
    @Public()
    @UseGuards(BotGuard)
    @HttpCode(204)
    @ApiOperation({ summary: 'Remove a server (Bot only, idempotent)' })
    async removeByBot(@Param('id') id: string) {
        await this.serversService.removeServer(id);
    }

    @Patch(':id/bot')
    @Public()
    @UseGuards(BotGuard)
    @ApiOperation({ summary: 'Partial update a server (Bot only, no ownership check)' })
    @ApiResponse({ status: 200, description: 'Server updated successfully.' })
    updateByBot(
        @Param('id') id: string,
        @Body() updateServerDto: UpdateServerDto,
    ) {
        return this.serversService.updateByBot(id, updateServerDto);
    }

    @Get()
    @Public()
    @SkipThrottle()
    @Header('Cache-Control', 'public, max-age=30')
    @ApiOperation({ summary: 'Get all servers (paginated)' })
    findAll(@Query() dto: FindServersDto) {
        return this.serversService.findAll(dto);
    }

    @Get('total-members')
    @Public()
    @SkipThrottle()
    @Header('Cache-Control', 'public, max-age=60')
    @ApiOperation({ summary: 'Get total member count across all servers' })
    getTotalMembers() {
        return this.serversService.getTotalMemberCount();
    }

    @Get(':id')
    @Public()
    @SkipThrottle()
    @Header('Cache-Control', 'public, max-age=30')
    @ApiOperation({ summary: 'Get a server by ID' })
    @ApiResponse({ status: 404, description: 'Server not found.' })
    findOne(
        @Param('id') id: string,
        @Query('includeStats') includeStats?: string,
    ) {
        return this.serversService.findOne(id, includeStats === 'true');
    }

    @Post(':id/vote')
    @Throttle({ short: { ttl: 60000, limit: 5 } })
    @ApiOperation({ summary: 'Vote for a server' })
    @ApiResponse({ status: 200, description: 'Vote cast successfully' })
    @ApiResponse({ status: 409, description: 'Vote cooldown active' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    vote(@Param('id') id: string, @CurrentUser() user: RequestUser) {
        return this.serversService.vote(id, user.userId);
    }

    @Post(':id/bot-vote')
    @Public()
    @UseGuards(BotGuard)
    @ApiOperation({ summary: 'Vote for a server (Bot only)' })
    @ApiResponse({ status: 200, description: 'Vote cast successfully' })
    botVote(@Param('id') id: string, @Body() body: BotVoteDto) {
        return this.serversService.vote(id, body.userId, body.username, body.avatarUrl);
    }

    @Patch(':id')
    @UseGuards(ServerOwnerGuard)
    @ApiOperation({ summary: 'Update a server (owner only — admin fields excluded)' })
    @ApiResponse({ status: 200, description: 'Server updated successfully.' })
    @ApiResponse({ status: 404, description: 'Server not found.' })
    update(
        @Param('id') id: string,
        @Body() updateServerDto: UserUpdateServerDto,
        @CurrentUser() user: RequestUser,
    ) {
        return this.serversService.update(id, updateServerDto, user.discordId);
    }

    @Delete(':id')
    @UseGuards(ServerOwnerGuard)
    @ApiOperation({ summary: 'Delete a server' })
    @ApiResponse({ status: 200, description: 'Server deleted successfully.' })
    @ApiResponse({ status: 403, description: 'Forbidden: you do not own this server.' })
    @ApiResponse({ status: 404, description: 'Server not found.' })
    remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
        return this.serversService.remove(id, user.discordId);
    }
}
