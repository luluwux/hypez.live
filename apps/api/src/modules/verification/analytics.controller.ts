import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AdminGuard } from './admin.guard';

@ApiTags('Analytics')
@Controller('admin/analytics')
@UseGuards(AdminGuard)
@ApiSecurity('admin-key')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard analytics (Admin only)' })
    async getStats() {
        return await this.analyticsService.getAnalytics();
    }

    @Get('real-time')
    @ApiOperation({ summary: 'Get real-time metrics only' })
    async getRealTimeMetrics() {
        return await this.analyticsService.getRealTimeMetrics();
    }

    @Get('trust-distribution')
    @ApiOperation({ summary: 'Get trust score distribution' })
    async getTrustDistribution() {
        return await this.analyticsService.getTrustScoreDistribution();
    }

    @Get('performance')
    @ApiOperation({ summary: 'Get performance metrics' })
    async getPerformance() {
        return await this.analyticsService.getPerformanceMetrics();
    }
}
