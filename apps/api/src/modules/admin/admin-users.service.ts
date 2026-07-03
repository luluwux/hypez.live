import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service.js';
import { UpdateUserDto, OverrideTrustScoreDto } from './dto/admin.dto.js';

@Injectable()
export class AdminUsersService {
    private readonly logger = new Logger(AdminUsersService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getAllUsers(page = 1, limit = 50, search?: string) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                  OR: [
                      { id: { contains: search } },
                      { name: { contains: search, mode: 'insensitive' as const } },
                      { email: { contains: search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    trustScore: true,
                    premiumLevel: true,
                    badges: true,
                    isPublished: true,
                    profileViews: true,
                    hypePoints: true,
                    emailVerified: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async searchUsers(query: string) {
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { id: { contains: query } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 20,
        });
    }

    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) return null;

        const votes = await this.prisma.vote.findMany({
            where: { userId: id },
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                server: { select: { id: true, name: true } },
            },
        });

        return { ...user, votes };
    }

    async updateUser(id: string, dto: UpdateUserDto) {
        const data: Record<string, unknown> = {};
        if (dto.name       !== undefined) data.name        = dto.name;
        if (dto.role       !== undefined) data.role        = dto.role;
        if (dto.badges     !== undefined) data.badges      = dto.badges;
        if (dto.trustScore !== undefined) data.trustScore  = dto.trustScore;
        if (dto.premiumLevel !== undefined) data.premiumLevel = dto.premiumLevel;
        if (dto.isPublished  !== undefined) data.isPublished  = dto.isPublished;

        const updated = await this.prisma.user.update({ where: { id }, data });
        this.logger.log(`User ${id} updated by admin: ${JSON.stringify(dto)}`);
        return updated;
    }

    async deleteUser(id: string) {
        await this.prisma.user.delete({ where: { id } });
        this.logger.warn(`User ${id} deleted by admin`);
        return { success: true, message: 'User deleted' };
    }

    async overrideTrustScore(userId: string, dto: OverrideTrustScoreDto) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { trustScore: dto.trustScore },
        });
        this.logger.log(`TrustScore overridden for user ${userId}: ${dto.trustScore} (reason: ${dto.reason})`);
        return updated;
    }
}
