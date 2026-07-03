import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto.js';

// Global in-memory cache for heavy admin stats
const CACHE = new Map<string, { data: unknown; expiry: number }>();

// Helper for temporary caching of heavy admin queries
function getCache<T>(key: string): T | null {
    const cached = CACHE.get(key);
    if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
    }
    return null;
}

function setCache(key: string, data: unknown) {
    CACHE.set(key, { data, expiry: Date.now() + 5 * 60 * 1000 }); // 5 min cache
}

@Injectable()
export class AdminSystemService {
    private readonly logger = new Logger(AdminSystemService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getSystemSettings() {
        let settings = await this.prisma.systemSettings.findUnique({ where: { id: "global" } });
        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: {
                    id: "global",
                    siteName: "Hypez",
                    siteUrl: "https://hypez.live",
                    siteDescription: "Discord botlarınızı kolayca yönetin ve özelleştirin",
                    adminEmail: "admin@hypez.live",
                    supportEmail: "support@hypez.live",
                    defaultLanguage: "tr",
                    timezone: "Europe/Istanbul",
                    currency: "TRY",
                    maintenanceMode: false,
                }
            });
        }
        return settings;
    }

    async updateSystemSettings(dto: UpdateSystemSettingsDto) {
        const updated = await this.prisma.systemSettings.update({
            where: { id: "global" },
            data: dto
        });
        
        await this.prisma.auditLog.create({
            data: {
                adminId: "SystemAdmin",
                action: "UPDATE_SYSTEM_SETTINGS",
                details: `System settings updated: ${Object.keys(dto).join(', ')}`
            }
        });

        return updated;
    }

    async getSystemHealth() {
        const cacheKey = 'system_health';
        const cached = getCache(cacheKey);
        if (cached) return cached;

        const [totalServers, totalUsers, totalVotes, recentVotes] = await Promise.all([
            this.prisma.server.count(),
            this.prisma.user.count(),
            this.prisma.vote.count(),
            this.prisma.vote.count({
                where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            }),
        ]);

        let visibleServers = totalServers;
        let premiumServers = 0;
        let tokenServers = 0;
        let recentServers = 0;

        try {
            [visibleServers, premiumServers, tokenServers, recentServers] = await Promise.all([
                this.prisma.server.count({ where: { isVisible: true } }),
                this.prisma.server.count({ where: { isPremium: true } }),
                this.prisma.server.count({ where: { isToken: true } }),
                this.prisma.server.count({
                    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                }),
            ]);
        } catch (e) {
            this.logger.warn('New schema fields not available yet, falling back to defaults.');
            visibleServers = totalServers;
            premiumServers = 0;
            tokenServers = 0;
            recentServers = 0;
        }

        const result = {
            servers: {
                total: totalServers,
                visible: visibleServers,
                hidden: totalServers - visibleServers,
                premium: premiumServers,
                token: tokenServers,
                newThisWeek: recentServers,
            },
            users: { total: totalUsers },
            votes: { total: totalVotes, last24h: recentVotes },
            timestamp: new Date().toISOString(),
        };

        setCache(cacheKey, result);
        return result;
    }

    async getDashboardStats(period = 'weekly') {
        const cacheKey = `dashboard_stats_${period}`;
        const cached = getCache(cacheKey);
        if (cached) return cached;

        let recentLogs: any[] = [];
        try {
            recentLogs = await this.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
        } catch (e) {
            // DB not pushed yet
        }

        const today = new Date();
        const serverGrowth: { name: string; count: number }[] = [];
        
        if (period === 'weekly') {
            for (let i = 6; i >= 0; i--) {
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
                const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i + 1);
                
                const count = await this.prisma.server.count({
                    where: { createdAt: { gte: startOfDay, lt: endOfDay } }
                });

                serverGrowth.push({
                    name: startOfDay.toLocaleDateString('tr-TR', { weekday: 'short' }),
                    count,
                });
            }
        } else if (period === 'monthly') {
            for (let i = 29; i >= 0; i -= Math.floor(30/7)) {
                const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
                const endDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i + Math.floor(30/7));
                
                const count = await this.prisma.server.count({
                    where: { createdAt: { gte: startDay, lt: endDay } }
                });

                serverGrowth.push({
                    name: `${startDay.getDate()} ${startDay.toLocaleDateString('tr-TR', { month: 'short' })}`,
                    count,
                });
            }
        } else if (period === 'yearly') {
            for (let i = 11; i >= 0; i--) {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
                
                const count = await this.prisma.server.count({
                    where: { createdAt: { gte: startOfMonth, lt: endOfMonth } }
                });

                serverGrowth.push({
                    name: startOfMonth.toLocaleDateString('tr-TR', { month: 'short' }),
                    count,
                });
            }
        }

        const stats = await this.getSystemHealth();

        const result = {
            serverGrowth,
            recentLogs,
            stats
        };

        setCache(cacheKey, result);
        return result;
    }

    async getAllTags() {
        return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
    }

    async createTag(dto: { name: string; color?: string; emoji?: string }) {
        const tag = await this.prisma.tag.create({ data: dto });
        this.logger.log(`Tag created: ${tag.id} (${tag.name})`);
        return tag;
    }

    async updateTag(id: string, dto: { name?: string; color?: string; emoji?: string }) {
        const tag = await this.prisma.tag.update({ where: { id }, data: dto });
        this.logger.log(`Tag updated: ${id}`);
        return tag;
    }

    async deleteTag(id: string) {
        await this.prisma.tag.delete({ where: { id } });
        this.logger.log(`Tag deleted: ${id}`);
        return { success: true };
    }

    async getAllBadges() {
        return this.prisma.badge.findMany({ orderBy: { name: 'asc' } });
    }

    async createBadge(dto: { name: string; icon?: string; color?: string; description?: string; targetType?: string }) {
        const badge = await this.prisma.badge.create({ data: dto });
        this.logger.log(`Badge created: ${badge.id} (${badge.name})`);
        return badge;
    }

    async updateBadge(id: string, dto: { name?: string; icon?: string; color?: string; description?: string; targetType?: string }) {
        const badge = await this.prisma.badge.update({ where: { id }, data: dto });
        this.logger.log(`Badge updated: ${id}`);
        return badge;
    }

    async deleteBadge(id: string) {
        await this.prisma.badge.delete({ where: { id } });
        this.logger.log(`Badge deleted: ${id}`);
        return { success: true };
    }

    async getAllCategories() {
        return this.prisma.category.findMany({
            orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        });
    }

    async createCategory(dto: { name: string; slug?: string; emoji?: string; color?: string; sortOrder?: number }) {
        const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const category = await this.prisma.category.create({
            data: {
                name: dto.name,
                slug,
                emoji: dto.emoji || '📁',
                color: dto.color || '#6366f1',
                sortOrder: dto.sortOrder || 0,
            },
        });
        this.logger.log(`Category created: ${category.id} (${category.name})`);
        return category;
    }

    async updateCategory(id: string, dto: { name?: string; slug?: string; emoji?: string; color?: string; sortOrder?: number; isActive?: boolean }) {
        const data: Record<string, unknown> = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.slug !== undefined) data.slug = dto.slug;
        if (dto.emoji !== undefined) data.emoji = dto.emoji;
        if (dto.color !== undefined) data.color = dto.color;
        if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
        if (dto.isActive !== undefined) data.isActive = dto.isActive;

        const category = await this.prisma.category.update({ where: { id }, data });
        this.logger.log(`Category updated: ${id}`);
        return category;
    }

    async deleteCategory(id: string) {
        await this.prisma.category.delete({ where: { id } });
        this.logger.log(`Category deleted: ${id}`);
        return { success: true };
    }

    async getAuditLogs(page = 1, limit = 50) {
        try {
            const skip = (page - 1) * limit;
            const [logs, total] = await Promise.all([
                this.prisma.auditLog.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.auditLog.count()
            ]);
            return {
                logs,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            };
        } catch(e) {
            return { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
        }
    }

    private static readonly ALLOWED_APPLICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

    async getApplications(page = 1, limit = 50, status?: string) {
        const skip = (page - 1) * limit;
        const validStatus = status && AdminSystemService.ALLOWED_APPLICATION_STATUSES.includes(status.toUpperCase())
            ? status.toUpperCase()
            : undefined;
        const where = validStatus ? { status: validStatus as any } : {};

        const [applications, total] = await Promise.all([
            this.prisma.application.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    server: { select: { id: true, name: true, icon: true } },
                },
            }),
            this.prisma.application.count({ where }),
        ]);

        return {
            applications,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async updateApplicationStatus(id: string, status: string, adminId: string) {
        const normalizedStatus = status.toUpperCase();
        if (!AdminSystemService.ALLOWED_APPLICATION_STATUSES.includes(normalizedStatus) || normalizedStatus === 'PENDING') {
            throw new Error(`Invalid application status: ${status}. Must be APPROVED or REJECTED.`);
        }
        const application = await this.prisma.application.update({
            where: { id },
            data: {
                status: normalizedStatus as any,
                reviewedBy: adminId
            },
        });
        this.logger.log(`Application ${id} status updated to ${status} by ${adminId}`);

        // Send Log Message
        const logChannelId = process.env.APPS_LOG_CHANNEL_ID;
        const botToken = process.env.DISCORD_TOKEN;
        if (logChannelId && botToken) {
            const emoji = status === 'APPROVED' ? '✅' : '❌';
            const statusText = status === 'APPROVED' ? 'Kabul Edildi' : 'Reddedildi';
            
            fetch(`https://discord.com/api/v10/channels/${logChannelId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${botToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: `${emoji} **BAŞVURU SONUÇLANDI**\n**Kullanıcı:** <@${application.discordUserId}> (${application.discordUserId})\n**Tür:** \`${application.type}\`\n**Sonuç:** ${statusText}`
                })
            }).catch(e => this.logger.error('Failed to send discord log', e));
        }

        return application;
    }
}
