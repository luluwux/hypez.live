import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IngestionService } from './ingestion.service.js';
import { BotGuard } from '../../common/guards/bot.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { IngestStatsDto } from './dto/ingest-stats.dto.js';

@ApiTags('Ingestion')
@ApiSecurity('x-bot-secret')
@Controller('ingestion')
export class IngestionController {
    constructor(private readonly ingestionService: IngestionService) {}

    @Post('stats')
    @Public()
    @UseGuards(BotGuard)
    @ApiOperation({ summary: 'Receive periodic stats from the Bot (Bot secret required)' })
    async ingestStats(@Body() data: IngestStatsDto) {
        await this.ingestionService.queueStats(data);
        return { success: true, message: 'Stats queued for processing' };
    }
}
