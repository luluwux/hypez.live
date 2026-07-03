import { Worker } from 'bullmq';
import { HypezClient } from './structures/client';
import { updateLeaderboardJob, runFullUpdateJob } from './handlers/leaderboard.handler';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env dosyasını yükle
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL?.replace('localhost', '127.0.0.1') || 'redis://127.0.0.1:6379';

// Komut/Event yüklemeden sade client
const client = new HypezClient();

client.once('ready', () => {
    console.log('[Worker] Discord client ready for background tasks');
    
    const worker = new Worker('leaderboard', async (job: any) => {
        const { guildId } = job.data;
        if (job.name === 'update') {
            console.log(`[Worker] Processing text leaderboard update for ${guildId}`);
            await updateLeaderboardJob(client, guildId);
        } else if (job.name === 'full-update') {
            console.log(`[Worker] Processing FULL leaderboard update for ${guildId}`);
            await runFullUpdateJob(client, guildId);
        }
    }, {
        connection: { 
            url: redisUrl,
            maxRetriesPerRequest: null
        },
        limiter: {
            max: 50,       // maksimum 50 iş
            duration: 1000, // her 1 saniyede
        },
        concurrency: 5
    });
    
    worker.on('error', err => {
        console.error('[Worker] Redis/BullMQ error:', err.message);
    });
    
    worker.on('completed', (job: any) => {
        console.log(`[Worker] Job ${job.id} completed`);
    });

    worker.on('failed', (job: any, err: any) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err);
    });

    console.log('[Worker] BullMQ Worker started');
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);
