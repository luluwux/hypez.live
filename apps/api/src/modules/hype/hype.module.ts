import { Module } from '@nestjs/common';

import { EventsModule } from '../../events/events.module.js';
import { HypeController } from './hype.controller.js';
import { HypeService } from './hype.service.js';
import { HypeResetCron } from './hype-reset.cron.js';
import { PrismaService } from '../../common/services/prisma.service.js';

@Module({
    imports: [EventsModule],
    controllers: [HypeController],
    providers: [HypeService, HypeResetCron, PrismaService],
    exports: [HypeService],
})
export class HypeModule {}
