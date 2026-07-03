import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AdminServersService } from './admin-servers.service.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminBotService } from './admin-bot.service.js';
import { AdminSystemService } from './admin-system.service.js';
import { UpdateServerDto, UpdateUserDto, OverrideTrustScoreDto, AddHypeDto, UpdateBotSettingsDto, CreateBotCommandDto, UpdateBotCommandDto, UpdateBotPermissionDto } from './dto/admin.dto.js';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto.js';
import { PrismaService } from '../../common/services/prisma.service.js';

@Injectable()
export class AdminService {
    constructor(
        private readonly serversService: AdminServersService,
        private readonly usersService: AdminUsersService,
        private readonly botService: AdminBotService,
        private readonly systemService: AdminSystemService,
        private readonly prisma: PrismaService
    ) {}

    getAllServers(page: number = 1, limit: number = 50) {
        return this.serversService.getAllServers(page, limit);
    }

    getFlaggedServers() {
        return this.serversService.getFlaggedServers();
    }

    getServerById(id: string) {
        return this.serversService.getServerById(id);
    }

    updateServer(id: string, updateDto: UpdateServerDto) {
        return this.serversService.updateServer(id, updateDto);
    }

    addHype(id: string, addHypeDto: AddHypeDto) {
        return this.serversService.addHype(id, addHypeDto);
    }

    deleteServer(id: string) {
        return this.serversService.deleteServer(id);
    }

    getAllUsers(page = 1, limit = 50, search?: string) {
        return this.usersService.getAllUsers(page, limit, search);
    }

    searchUsers(query: string) {
        return this.usersService.searchUsers(query);
    }

    getUserById(id: string) {
        return this.usersService.getUserById(id);
    }

    updateUser(id: string, dto: UpdateUserDto) {
        return this.usersService.updateUser(id, dto);
    }

    deleteUser(id: string) {
        return this.usersService.deleteUser(id);
    }

    overrideTrustScore(userId: string, dto: OverrideTrustScoreDto) {
        return this.usersService.overrideTrustScore(userId, dto);
    }

    getSystemSettings() {
        return this.systemService.getSystemSettings();
    }

    updateSystemSettings(dto: UpdateSystemSettingsDto) {
        return this.systemService.updateSystemSettings(dto);
    }

    getSystemHealth() {
        return this.systemService.getSystemHealth();
    }

    getDashboardStats(period = 'weekly') {
        return this.systemService.getDashboardStats(period);
    }

    getAllTags() {
        return this.systemService.getAllTags();
    }

    createTag(dto: { name: string; color?: string; emoji?: string }) {
        return this.systemService.createTag(dto);
    }

    updateTag(id: string, dto: { name?: string; color?: string; emoji?: string }) {
        return this.systemService.updateTag(id, dto);
    }

    deleteTag(id: string) {
        return this.systemService.deleteTag(id);
    }

    getAllBadges() {
        return this.systemService.getAllBadges();
    }

    createBadge(dto: { name: string; icon?: string; color?: string; description?: string; targetType?: string }) {
        return this.systemService.createBadge(dto);
    }

    updateBadge(id: string, dto: { name?: string; icon?: string; color?: string; description?: string; targetType?: string }) {
        return this.systemService.updateBadge(id, dto);
    }

    deleteBadge(id: string) {
        return this.systemService.deleteBadge(id);
    }

    getAllCategories() {
        return this.systemService.getAllCategories();
    }

    createCategory(dto: { name: string; slug?: string; emoji?: string; color?: string; sortOrder?: number }) {
        return this.systemService.createCategory(dto);
    }

    updateCategory(id: string, dto: { name?: string; slug?: string; emoji?: string; color?: string; sortOrder?: number; isActive?: boolean }) {
        return this.systemService.updateCategory(id, dto);
    }

    deleteCategory(id: string) {
        return this.systemService.deleteCategory(id);
    }

    getAuditLogs(page = 1, limit = 50) {
        return this.systemService.getAuditLogs(page, limit);
    }

    getApplications(page = 1, limit = 50, status?: string) {
        return this.systemService.getApplications(page, limit, status);
    }

    updateApplicationStatus(id: string, status: string, adminId: string) {
        return this.systemService.updateApplicationStatus(id, status, adminId);
    }

    getBotSettings() {
        return this.botService.getBotSettings();
    }

    updateBotSettings(dto: UpdateBotSettingsDto) {
        return this.botService.updateBotSettings(dto);
    }

    getBotCommands(search?: string, category?: string) {
        return this.botService.getBotCommands(search, category);
    }

    createBotCommand(dto: CreateBotCommandDto) {
        return this.botService.createBotCommand(dto);
    }

    updateBotCommand(id: string, dto: UpdateBotCommandDto) {
        return this.botService.updateBotCommand(id, dto);
    }

    deleteBotCommand(id: string) {
        return this.botService.deleteBotCommand(id);
    }

    getBotPermissions(category?: string) {
        return this.botService.getBotPermissions(category);
    }

    updateBotPermission(id: string, dto: UpdateBotPermissionDto) {
        return this.botService.updateBotPermission(id, dto);
    }

    getBotLogs(level?: string, category?: string) {
        return this.botService.getBotLogs(level, category);
    }

    clearBotLogs() {
        return this.botService.clearBotLogs();
    }

    async generatePremiumCodes(duration: number, count = 1) {
        const codes = [];
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        // crypto.randomInt is cryptographically secure; Math.random() is not suitable for secrets
        const segment = () => Array.from({ length: 4 }, () => chars[crypto.randomInt(0, chars.length)]).join('');
        
        for (let i = 0; i < count; i++) {
            let code = `HYPEZ-${segment()}-${segment()}-${segment()}`;
            // Double check to prevent code collision
            let exists = await this.prisma.premiumCode.findUnique({ where: { code } });
            while (exists) {
                code = `HYPEZ-${segment()}-${segment()}-${segment()}`;
                exists = await this.prisma.premiumCode.findUnique({ where: { code } });
            }
            const created = await this.prisma.premiumCode.create({
                data: { code, duration }
            });
            codes.push(created);
        }
        return codes;
    }

    async getPremiumCodes() {
        return this.prisma.premiumCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                server: {
                    select: {
                        id: true,
                        name: true,
                        icon: true
                    }
                }
            }
        });
    }

    async deletePremiumCode(id: string) {
        return this.prisma.premiumCode.delete({
            where: { id }
        });
    }
}
