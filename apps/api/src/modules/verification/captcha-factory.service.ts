import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import Piscina from 'piscina';
import { join } from 'path';

export enum CaptchaTier {
    CRITICAL = 'CRITICAL', // 0-30 Score
    NORMAL = 'NORMAL',     // 31-70 Score
    TRUSTED = 'TRUSTED'    // 71+ Score
}

interface CaptchaItem {
    id: string;
    imageBuffer: Buffer;
    answer: string;
    options: string[];
    tier: CaptchaTier;
    createdAt: number;
}

@Injectable()
export class CaptchaFactoryService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CaptchaFactoryService.name);
    private piscina: Piscina;

    private pools = {
        [CaptchaTier.CRITICAL]: [] as CaptchaItem[],
        [CaptchaTier.NORMAL]: [] as CaptchaItem[],
        [CaptchaTier.TRUSTED]: [] as CaptchaItem[]
    };

    private pending = new Map<string, CaptchaItem>();

    constructor() {
        // tsx ile çalışırken __filename .ts biter ama ts-node/register yok
        // tsx'in kendi register'ını kullanmak gerekir
        const isTsx = process.argv[0].includes('tsx') || process.execArgv.some(a => a.includes('tsx'));
        const isTsFile = __filename.endsWith('.ts');
        const extension = isTsFile ? 'ts' : 'js';
        const workerPath = join(__dirname, `captcha.worker.${extension}`);

        // Worker thread execArgv: tsx için doğru loader
        let execArgv: string[] | undefined;
        if (isTsFile) {
            // tsx'in import hook'unu kullan (Node 18+ destekler)
            execArgv = ['--import', 'tsx/esm'];
        }

        this.piscina = new Piscina({
            filename: workerPath,
            minThreads: 2,
            maxThreads: 4,
            idleTimeout: 30000,
            execArgv
        });

        this.logger.log(`[Piscina] Initialized. Worker: ${workerPath}`);
    }

    async onModuleInit() {
        this.logger.log('Sistem başlatılıyor, Captcha havuzları dolduruluyor...');
        // Initial dry run / refill - Non-blocking to let API listen immediately
        this.refillPools().catch(err => this.logger.error('Initial refill error', err));
    }

    async onModuleDestroy() {
        this.logger.log('[Piscina] Shutting down worker pool...');
        await this.piscina.destroy();
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        // Smart Refill Logic: run every minute check
        await this.refillPools();
        this.cleanupPending();
        this.logPoolStats();
    }

    private async refillPools() {
        // Check all tiers
        const tasks: Promise<void>[] = [];
        tasks.push(this.checkAndRefillTier(CaptchaTier.CRITICAL, 20));
        tasks.push(this.checkAndRefillTier(CaptchaTier.NORMAL, 20));
        tasks.push(this.checkAndRefillTier(CaptchaTier.TRUSTED, 20));

        await Promise.all(tasks);
    }

    private async checkAndRefillTier(tier: CaptchaTier, targetSize: number) {
        const currentSize = this.pools[tier].length;
        // Logic: specific request "If a tier's pool falls below 50%"
        const threshold = targetSize * 0.5;

        if (currentSize < threshold) {
            const needed = targetSize - currentSize;
            this.logger.log(`[Piscina] Tier ${tier} low (${currentSize}/${targetSize}). Queuing ${needed} tasks...`);

            const refillPromises: Promise<CaptchaItem>[] = [];
            for (let i = 0; i < needed; i++) {
                refillPromises.push(this.scheduleGeneration(tier));
            }

            try {
                // Piscina manages the queue/concurrency here, so we can await all
                const results = await Promise.all(refillPromises);
                this.pools[tier].push(...results);
                this.logger.log(`[Piscina] Refilled ${results.length} for ${tier}.`);
            } catch (err) {
                this.logger.error(`[Piscina] Error during refill for ${tier}`, err);
            }
        }
    }

    private async scheduleGeneration(tier: CaptchaTier): Promise<CaptchaItem> {
        // this.logger.debug(`[Piscina] Task assigned for ${tier}`); // Too verbose? keeping it out for now or debug level

        const result = await this.piscina.run({ tier, id: uuidv4() });

        // Reconstruct buffer (Piscina copies buffers but let's be safe if JSON serialization occurred)
        // With Piscina transferList it should be efficient, but our worker returns object with buffer prop.
        if (result.imageBuffer && result.imageBuffer.type === 'Buffer') {
            result.imageBuffer = Buffer.from(result.imageBuffer.data);
        } else if (result.imageBuffer && !(result.imageBuffer instanceof Buffer)) {
            // If it came back as a UInt8Array or similar
            result.imageBuffer = Buffer.from(result.imageBuffer);
        }

        return result as CaptchaItem;
    }

    async getChallenge(tier: CaptchaTier): Promise<CaptchaItem> {
        const pool = this.pools[tier];

        if (pool.length === 0) {
            this.logger.warn(`${tier} havuzu boş! On-demand high-priority task.`);
            return await this.scheduleGeneration(tier);
        }

        const challenge = pool.shift()!;
        this.pending.set(challenge.id, challenge);

        // Trigger background refill if we just dipped below
        if (pool.length < 10) {
            // Don't await, let it queue in background
            this.checkAndRefillTier(tier, 20).catch(err => console.error(err));
        }

        return challenge;
    }

    validate(id: string, answer: string): boolean {
        const challenge = this.pending.get(id);
        if (!challenge) return false;

        const isValid = challenge.answer.toUpperCase() === answer.toUpperCase();
        this.pending.delete(id);
        return isValid;
    }

    private cleanupPending() {
        const now = Date.now();
        for (const [id, item] of this.pending) {
            if (now - item.createdAt > 5 * 60 * 1000) {
                this.pending.delete(id);
            }
        }
    }

    private logPoolStats() {
        this.logger.log(`[Piscina] Pool Utilization: Queue Size ${this.piscina.queueSize}, Workers Busy: ${this.piscina.completed}/${this.piscina.duration}`);
        // Note: Piscina doesn't expose a direct "utilization %" easily without math, 
        // but queueSize tells us if we are backed up.
        this.logger.log(`[Stats] Pools: Critical=${this.pools.CRITICAL.length}, Normal=${this.pools.NORMAL.length}, Trusted=${this.pools.TRUSTED.length}`);
    }
}
