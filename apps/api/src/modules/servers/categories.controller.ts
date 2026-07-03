// Public read-only endpoint for server categories — no auth required.
// Used by the frontend (FilterSidebar, discover page) and the bot.
import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../common/services/prisma.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Categories')
@Controller('categories')
@Public()
export class CategoriesController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    @SkipThrottle()
    @Header('Cache-Control', 'public, max-age=3600')
    @ApiOperation({ summary: 'Get all active categories (public)' })
    async getAllActiveCategories() {
        return this.prisma.category.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                emoji: true,
                color: true,
                sortOrder: true,
                isActive: true,
            },
        });
    }
}
