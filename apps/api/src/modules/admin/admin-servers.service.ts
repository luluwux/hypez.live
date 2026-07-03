import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import { UpdateServerDto, AddHypeDto } from './dto/admin.dto.js';
import { PremiumTier } from '@hypez/shared-types';
import { RedisCacheService } from '../../common/services/redis-cache.service.js';

type AdminServerUpdatePayload = {
    premiumTier?: PremiumTier;
    isPremium?: boolean;
    premiumExpiresAt?: Date | null;
    isVisible?: boolean;
    isToken?: boolean;
    categories?: string[];
    description?: string;
    badges?: string[];
};

@Injectable()
export class AdminServersService {
    private readonly logger = new Logger(AdminServersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RedisCacheService,
    ) {}

    async getAllServers(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [servers, total] = await Promise.all([
            this.prisma.server.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    icon: true,
                    memberCount: true,
                    votes: true,
                    categories: true,
                    premiumTier: true,
                    isPremium: true,
                    premiumExpiresAt: true,
                    isVisible: true,
                    isToken: true,
                    badges: true,
                    createdAt: true,
                    ownerId: true,
                },
            }),
            this.prisma.server.count(),
        ]);

        return {
            servers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFlaggedServers() {
        return this.prisma.server.findMany({
            where: { isFlagged: true },
            orderBy: { totalHypes: 'desc' },
        });
    }

    async getServerById(id: string) {
        return this.prisma.server.findUnique({
            where: { id },
            include: {
                voteHistory: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    async updateServer(id: string, updateDto: UpdateServerDto) {
        const data: AdminServerUpdatePayload = {};

        if (updateDto.premiumTier !== undefined) {
            data.premiumTier = updateDto.premiumTier;
            data.isPremium = updateDto.premiumTier !== PremiumTier.NONE;
        }

        if (updateDto.premiumExpiresAt !== undefined) {
            data.premiumExpiresAt = updateDto.premiumExpiresAt
                ? new Date(updateDto.premiumExpiresAt)
                : null;
        }

        if (updateDto.isVisible !== undefined) data.isVisible = updateDto.isVisible;
        if (updateDto.isToken !== undefined) data.isToken = updateDto.isToken;
        if (updateDto.categories !== undefined) data.categories = updateDto.categories;
        if (updateDto.description !== undefined) data.description = updateDto.description;
        if (updateDto.badges !== undefined) data.badges = updateDto.badges;

        const updated = await this.prisma.server.update({
            where: { id },
            data,
        });

        // Invalidate Redis cache so changes appear immediately in the client
        try {
            await Promise.all([
                this.cache.del(`servers:detail:${id}`),
                this.cache.delPattern('servers:list:*'),
            ]);
            this.logger.log(`Server ${id} cache invalidated successfully`);
        } catch (cacheErr) {
            this.logger.error(`Failed to invalidate cache for server ${id}`, cacheErr);
        }

        this.logger.log(`Server ${id} updated by admin: ${JSON.stringify(updateDto)}`);
        return updated;
    }

    async addHype(_id: string, _addHypeDto: AddHypeDto) {
        const server = await this.prisma.server.findUnique({ where: { id: _id } });
        this.logger.warn(`Hype field not implemented in schema yet for server ${_id}`);
        return server;
    }

    async deleteServer(id: string) {
        await this.prisma.server.delete({ where: { id } });
        
        // Invalidate Redis cache for list and detail
        try {
            await Promise.all([
                this.cache.del(`servers:detail:${id}`),
                this.cache.delPattern('servers:list:*'),
            ]);
            this.logger.log(`Server ${id} deleted cache invalidated successfully`);
        } catch (cacheErr) {
            this.logger.error(`Failed to invalidate deleted cache for server ${id}`, cacheErr);
        }

        this.logger.warn(`Server ${id} deleted by admin`);
        return { success: true, message: 'Server deleted' };
    }
}
