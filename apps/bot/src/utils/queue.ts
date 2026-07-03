import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL?.replace('localhost', '127.0.0.1') || 'redis://127.0.0.1:6379';

const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // BullMQ requires this
    ...(redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
});

connection.on('error', (err) => {
    console.error('[BullMQ Queue] Redis Error:', err.message);
});

export const leaderboardQueue = new Queue('leaderboard', { 
    connection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    }
});
