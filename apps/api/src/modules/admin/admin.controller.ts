import {
    Controller,
    Get,
    Patch,
    Delete,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from './admin.guard.js';
import { UpdateServerDto, UpdateUserDto, OverrideTrustScoreDto, AddHypeDto, CreateTagDto, UpdateTagDto, CreateBadgeDto, UpdateBadgeDto, CreateCategoryDto, UpdateCategoryDto, UpdateBotSettingsDto, CreateBotCommandDto, UpdateBotCommandDto, UpdateBotPermissionDto, CreatePremiumCodeDto } from './dto/admin.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto.js';

@ApiTags('Admin')
@Controller('admin')
@Public()          // JWT guard'ı bypass et — güvenlik AdminGuard (x-admin-key) ile sağlanıyor
@UseGuards(AdminGuard)
@ApiSecurity('admin-api-key')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}
    @Get('servers')
    @ApiOperation({ summary: 'Get all servers (paginated)' })
    async getAllServers(@Query() pagination: PaginationDto) {
        // PaginationDto uses @Type(() => Number) + class-validator — NaN is impossible here
        return this.adminService.getAllServers(pagination.page, pagination.limit);
    }

    @Get('servers/flagged')
    @ApiOperation({ summary: 'Get all flagged servers' })
    async getFlaggedServers() {
        return this.adminService.getFlaggedServers();
    }

    @Get('servers/:id')
    @ApiOperation({ summary: 'Get server by ID' })
    async getServer(@Param('id') id: string) {
        return this.adminService.getServerById(id);
    }

    @Patch('servers/:id')
    @ApiOperation({ summary: 'Update server (premium tier, etc.)' })
    async updateServer(
        @Param('id') id: string,
        @Body() updateDto: UpdateServerDto,
    ) {
        return this.adminService.updateServer(id, updateDto);
    }

    @Post('servers/:id/hype')
    @ApiOperation({ summary: 'Add or remove hype points (not yet implemented)' })
    async addHype(
        @Param('id') id: string,
        @Body() addHypeDto: AddHypeDto,
    ) {
        return this.adminService.addHype(id, addHypeDto);
    }

    @Delete('servers/:id')
    @ApiOperation({ summary: 'Delete server' })
    async deleteServer(@Param('id') id: string) {
        return this.adminService.deleteServer(id);
    }
    @Get('users')
    @ApiOperation({ summary: 'Get all users (paginated, optional search)' })
    async getAllUsers(@Query() pagination: PaginationDto, @Query('q') search?: string) {
        const safeSearch = search ? search.slice(0, 100) : undefined;
        return this.adminService.getAllUsers(pagination.page, pagination.limit, safeSearch);
    }

    @Get('users/search')
    @ApiOperation({ summary: 'Search users by ID, name, or email' })
    async searchUsers(@Query('q') query: string) {
        const safeQuery = typeof query === 'string' ? query.slice(0, 100) : '';
        return this.adminService.searchUsers(safeQuery);
    }

    @Get('users/:id')
    @ApiOperation({ summary: 'Get user by ID with full details' })
    async getUser(@Param('id') id: string) {
        return this.adminService.getUserById(id);
    }

    @Patch('users/:id')
    @ApiOperation({ summary: 'Update user (badges, role, trust score, etc.)' })
    async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.adminService.updateUser(id, dto);
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete user permanently' })
    async deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    @Patch('users/:id/trust')
    @ApiOperation({ summary: 'Override user trust score' })
    async overrideTrustScore(
        @Param('id') id: string,
        @Body() dto: OverrideTrustScoreDto,
    ) {
        return this.adminService.overrideTrustScore(id, dto);
    }
    @Get('applications')
    @ApiOperation({ summary: 'Get all applications (paginated, optional status filter)' })
    async getApplications(@Query() pagination: PaginationDto, @Query('status') status?: string) {
        return this.adminService.getApplications(pagination.page, pagination.limit, status);
    }

    @Patch('applications/:id/status')
    @ApiOperation({ summary: 'Update application status (APPROVED/REJECTED)' })
    async updateApplicationStatus(
        @Param('id') id: string,
        @Body() body: { status: string; adminId: string },
    ) {
        return this.adminService.updateApplicationStatus(id, body.status, body.adminId);
    }
    @Get('system/health')
    @ApiOperation({ summary: 'Get system health metrics' })
    async getSystemHealth() {
        return this.adminService.getSystemHealth();
    }

    @Get('dashboard/stats')
    @ApiOperation({ summary: 'Get dashboard statistics and recent logs' })
    async getDashboardStats(@Query('period') period?: string) {
        return this.adminService.getDashboardStats(period);
    }

    @Get('logs')
    @ApiOperation({ summary: 'Get full audit logs' })
    async getAuditLogs() {
        return this.adminService.getAuditLogs();
    }

    @Get('system/settings')
    @ApiOperation({ summary: 'Get system settings' })
    async getSystemSettings() {
        return this.adminService.getSystemSettings();
    }

    @Patch('system/settings')
    @ApiOperation({ summary: 'Update system settings' })
    async updateSystemSettings(@Body() dto: UpdateSystemSettingsDto) {
        return this.adminService.updateSystemSettings(dto);
    }
    @Get('tags')
    @ApiOperation({ summary: 'Get all tags' })
    async getAllTags() {
        return this.adminService.getAllTags();
    }

    @Post('tags')
    @ApiOperation({ summary: 'Create a new tag' })
    async createTag(@Body() dto: CreateTagDto) {
        return this.adminService.createTag(dto);
    }

    @Patch('tags/:id')
    @ApiOperation({ summary: 'Update a tag' })
    async updateTag(@Param('id') id: string, @Body() dto: UpdateTagDto) {
        return this.adminService.updateTag(id, dto);
    }

    @Delete('tags/:id')
    @ApiOperation({ summary: 'Delete a tag' })
    async deleteTag(@Param('id') id: string) {
        return this.adminService.deleteTag(id);
    }
    @Get('badges')
    @ApiOperation({ summary: 'Get all badges' })
    async getAllBadges() {
        return this.adminService.getAllBadges();
    }

    @Post('badges')
    @ApiOperation({ summary: 'Create a new badge' })
    async createBadge(@Body() dto: CreateBadgeDto) {
        return this.adminService.createBadge(dto);
    }

    @Patch('badges/:id')
    @ApiOperation({ summary: 'Update a badge' })
    async updateBadge(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
        return this.adminService.updateBadge(id, dto);
    }

    @Delete('badges/:id')
    @ApiOperation({ summary: 'Delete a badge' })
    async deleteBadge(@Param('id') id: string) {
        return this.adminService.deleteBadge(id);
    }
    @Get('categories')
    @ApiOperation({ summary: 'Get all categories' })
    async getAllCategories() {
        return this.adminService.getAllCategories();
    }

    @Post('categories')
    @ApiOperation({ summary: 'Create a new category' })
    async createCategory(@Body() dto: CreateCategoryDto) {
        return this.adminService.createCategory(dto);
    }

    @Patch('categories/:id')
    @ApiOperation({ summary: 'Update a category' })
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.adminService.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    @ApiOperation({ summary: 'Delete a category' })
    async deleteCategory(@Param('id') id: string) {
        return this.adminService.deleteCategory(id);
    }
    @Get('bot/settings')
    @ApiOperation({ summary: 'Get bot settings' })
    async getBotSettings() {
        return this.adminService.getBotSettings();
    }

    @Patch('bot/settings')
    @ApiOperation({ summary: 'Update bot settings' })
    async updateBotSettings(@Body() dto: UpdateBotSettingsDto) {
        return this.adminService.updateBotSettings(dto);
    }
    @Get('bot/commands')
    @ApiOperation({ summary: 'Get bot commands' })
    async getBotCommands(
        @Query('search') search?: string,
        @Query('category') category?: string,
    ) {
        return this.adminService.getBotCommands(search, category);
    }

    @Post('bot/commands')
    @ApiOperation({ summary: 'Create a new bot command' })
    async createBotCommand(@Body() dto: CreateBotCommandDto) {
        return this.adminService.createBotCommand(dto);
    }

    @Patch('bot/commands/:id')
    @ApiOperation({ summary: 'Update a bot command' })
    async updateBotCommand(
        @Param('id') id: string,
        @Body() dto: UpdateBotCommandDto,
    ) {
        return this.adminService.updateBotCommand(id, dto);
    }

    @Delete('bot/commands/:id')
    @ApiOperation({ summary: 'Delete a bot command' })
    async deleteBotCommand(@Param('id') id: string) {
        return this.adminService.deleteBotCommand(id);
    }
    @Get('bot/permissions')
    @ApiOperation({ summary: 'Get bot permissions' })
    async getBotPermissions(@Query('category') category?: string) {
        return this.adminService.getBotPermissions(category);
    }

    @Patch('bot/permissions/:id')
    @ApiOperation({ summary: 'Update bot permission status' })
    async updateBotPermission(
        @Param('id') id: string,
        @Body() dto: UpdateBotPermissionDto,
    ) {
        return this.adminService.updateBotPermission(id, dto);
    }
    @Get('bot/logs')
    @ApiOperation({ summary: 'Get bot logs' })
    async getBotLogs(
        @Query('level') level?: string,
        @Query('category') category?: string,
    ) {
        return this.adminService.getBotLogs(level, category);
    }

    @Delete('bot/logs')
    @ApiOperation({ summary: 'Clear all bot logs' })
    async clearBotLogs() {
        return this.adminService.clearBotLogs();
    }
    @Post('premium-codes')
    @ApiOperation({ summary: 'Generate premium codes' })
    async generatePremiumCodes(@Body() dto: CreatePremiumCodeDto) {
        return this.adminService.generatePremiumCodes(dto.duration, dto.count);
    }

    @Get('premium-codes')
    @ApiOperation({ summary: 'Get all premium codes' })
    async getPremiumCodes() {
        return this.adminService.getPremiumCodes();
    }

    @Delete('premium-codes/:id')
    @ApiOperation({ summary: 'Delete a premium code' })
    async deletePremiumCode(@Param('id') id: string) {
        return this.adminService.deletePremiumCode(id);
    }
}
