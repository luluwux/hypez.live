import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

interface StatsJobData {
    serverId: string;
    memberCount: number;
    activeMemberCount: number;
    voiceCount?: number;
    messageCount?: number;
}

@Processor('ingestion')
export class StatsProcessor extends WorkerHost {
    private readonly logger = new Logger(StatsProcessor.name);

    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async process(job: Job<StatsJobData>): Promise<void> {
        const { serverId, voiceCount, messageCount } = job.data;

        try {
            // Sadece snapshot oluşturmakla kalma, aynı zamanda Server'daki haftalık metrikleri de güncelle
            const voiceMinutes = (voiceCount ?? 0) * 5; // her 5 dakikada bir çalıştığı için

            await this.prisma.$transaction([
                this.prisma.serverStats.create({
                    data: {
                        serverId,
                        voiceCount: voiceCount ?? 0,
                        messageCount: messageCount ?? 0,
                    },
                }),
                this.prisma.server.update({
                    where: { id: serverId },
                    data: {
                        weeklyVoiceMinutes: { increment: voiceMinutes },
                        weeklyMessageCount: { increment: messageCount ?? 0 },
                    },
                })
            ]);

            this.logger.debug(
                `Stats snapshot recorded and weekly metrics updated for ${serverId}: voice=${voiceCount ?? 0}, messages=${messageCount ?? 0}`,
            );
        } catch (error) {
            this.logger.error(`Failed to record stats snapshot for ${serverId}:`, error);
            throw error;
        }
    }
}
