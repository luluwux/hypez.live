import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    Param,
    HttpCode,
    Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/interfaces/request-user.interface.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { RedeemPremiumDto } from './dto/redeem-premium.dto.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Public()
    @SkipThrottle()
    @Get()
    @ApiOperation({ summary: 'Get a list of published users' })
    findAll() {
        return this.usersService.findAll();
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile (full, including private fields)' })
    getMyProfile(@CurrentUser() user: RequestUser) {
        return this.usersService.getMyProfile(user.userId);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update profile fields' })
    updateProfile(
        @CurrentUser() user: RequestUser,
        @Body() body: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.userId, body);
    }

    @Get('me/servers')
    @ApiOperation({ summary: 'Get current user owned servers' })
    getMyServers(@CurrentUser() user: RequestUser) {
        return this.usersService.getMyServers(user.userId);
    }

    @Post('me/redeem-premium')
    @HttpCode(200)
    @ApiOperation({ summary: 'Redeem premium code for a server' })
    redeemPremium(
        @CurrentUser() user: RequestUser,
        @Body() body: RedeemPremiumDto,
    ) {
        return this.usersService.redeemPremiumCode(user.userId, body.code, body.serverId);
    }

    @Post('me/publish')
    @HttpCode(200)
    @ApiOperation({ summary: 'Publish user profile (makes it publicly visible)' })
    publishProfile(@CurrentUser() user: RequestUser) {
        return this.usersService.publishProfile(user.userId);
    }

    @Public()
    @SkipThrottle()
    @Get(':id')
    @ApiOperation({ summary: 'Get public user profile by ID' })
    @ApiResponse({ status: 404, description: 'User not found or profile not published.' })
    getProfile(@Param('id') id: string, @CurrentUser() viewer?: RequestUser) {
        return this.usersService.getProfile(id, viewer?.userId);
    }

    @Public()
    @Post(':id/view')
    @HttpCode(204)
    @ApiOperation({ summary: 'Record a profile view' })
    recordView(
        @Param('id') id: string,
        @CurrentUser() viewer: RequestUser | undefined,
        @Ip() ip: string,
    ) {
        const viewerIdOrIp = viewer?.userId || ip;
        return this.usersService.recordView(id, viewerIdOrIp, viewer?.userId);
    }

    @Post(':id/like')
    @Throttle({ short: { ttl: 60000, limit: 10 } })
    @HttpCode(200)
    @ApiOperation({ summary: 'Toggle like on a user profile' })
    toggleLike(@Param('id') id: string, @CurrentUser() liker: RequestUser) {
        return this.usersService.toggleLike(id, liker.userId);
    }
}
