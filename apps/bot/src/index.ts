import { HypezClient } from './structures/client';
import { logger } from './utils/logger';
import { stopStatsReporter } from './jobs/stats-reporter';
import { redisClient } from './utils/redis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') }); // Load root .env

const client = new HypezClient();

// Global error handlers - prevent crashes
process.on('unhandledRejection', (error: Error) => {
    logger.error({ err: error, stack: error.stack }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error: Error) => {
    logger.fatal({ err: error, stack: error.stack }, 'Uncaught Exception');
    // Stop all background jobs before exiting
    stopStatsReporter();
    // Give time to flush logs before exiting
    setTimeout(() => process.exit(1), 1000);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`[Bot] ${signal} alındı, kapatılıyor...`);

    // Stop background jobs first to prevent new work from starting
    stopStatsReporter();

    client.destroy();
    if (client.prisma) {
        await client.prisma.$disconnect();
    }
    await redisClient.disconnect();
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

(async () => {
    try {
        // Connect to Redis
        await redisClient.connect();

        await client.loadEvents();
        await client.loadCommands(); // Load into collection

        // Login
        const token = process.env.DISCORD_TOKEN;
        if (!token) {
            logger.fatal('DISCORD_TOKEN not found in .env');
            process.exit(1);
        }

        await client.start(token);

        logger.info('Bot started successfully');
    } catch (error) {
        console.error('Failed to start bot', error);
        logger.fatal({ err: error }, 'Failed to start bot');
        process.exit(1);
    }
})();




