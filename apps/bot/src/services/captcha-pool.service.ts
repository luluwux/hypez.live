import { Redis } from 'ioredis';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

const POOL_SIZE = 30;
const REFILL_THRESHOLD = 5;
const POOL_TTL = 600; // 10 minutes

// Bundled font file (guarantees zero-error rendering on all platforms)
const BUNDLED_FONT_PATH = path.join(__dirname, '../../assets/fonts/captcha-font.ttf');

const FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    'C:\\Windows\\Fonts\\arialbd.ttf',
    'C:\\Windows\\Fonts\\arial.ttf',
];

const CAPTCHA_FONT_FAMILY = (() => {
    // 1. Try to register the bundled font first
    try {
        if (fs.existsSync(BUNDLED_FONT_PATH)) {
            GlobalFonts.registerFromPath(BUNDLED_FONT_PATH, 'CaptchaFont');
            console.log(`[CaptchaPool] Registered bundled font from ${BUNDLED_FONT_PATH}`);
            return 'CaptchaFont';
        }
    } catch (e) {
        console.warn(`[CaptchaPool] Could not register bundled font:`, (e as Error).message);
    }

    // 2. Fallback to typical OS paths
    for (const p of FONT_CANDIDATES) {
        try {
            if (fs.existsSync(p)) {
                GlobalFonts.registerFromPath(p, 'CaptchaFont');
                console.log(`[CaptchaPool] Registered system font from ${p}`);
                return 'CaptchaFont';
            }
        } catch (e) {
            console.warn(`[CaptchaPool] Could not register system font ${p}:`, (e as Error).message);
        }
    }
    console.warn('[CaptchaPool] No TTF font found — captcha may render blank. Install fonts-dejavu-core or fonts-liberation.');
    return 'sans-serif';
})();

export function generateCaptcha(): { imageBuffer: Buffer; answer: string; options: string[] } {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let answer = '';
    for (let i = 0; i < 6; i++) {
        answer += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const WIDTH = 280;
    const HEIGHT = 100;
    const PAD_X = 30;
    const CHAR_SPACING = 40;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.font = `bold 40px ${CAPTCHA_FONT_FAMILY}`;
    ctx.fillStyle = '#cdd6f4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < answer.length; i++) {
        ctx.save();
        ctx.translate(PAD_X + i * CHAR_SPACING, HEIGHT / 2);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        ctx.fillText(answer[i], 0, 0);
        ctx.restore();
    }

    ctx.strokeStyle = '#89b4fa';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * WIDTH, Math.random() * HEIGHT);
        ctx.lineTo(Math.random() * WIDTH, Math.random() * HEIGHT);
        ctx.stroke();
    }

    const generateWrong = () => {
        let wrong = '';
        for (let i = 0; i < 6; i++) {
            wrong += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return wrong;
    };
    
    const options = [answer, generateWrong(), generateWrong(), generateWrong(), generateWrong()].sort(() => Math.random() - 0.5);

    return {
        imageBuffer: canvas.toBuffer('image/png'),
        answer,
        options
    };
}

export class CaptchaPoolService {
    constructor(private redis: Redis) {}

    async getCaptcha(): Promise<{ imageBuffer: Buffer; answer: string; options: string[] }> {
        const raw = await this.redis.lpop('captcha:pool');
        
        const remaining = await this.redis.llen('captcha:pool');
        if (remaining < REFILL_THRESHOLD) {
            this.refillPool().catch(console.error); // refill in background
        }

        if (!raw) {
            return generateCaptcha();
        }

        const parsed = JSON.parse(raw);
        // Convert JSON buffer back to node Buffer
        parsed.imageBuffer = Buffer.from(parsed.imageBuffer, 'base64');
        return parsed;
    }

    async refillPool(): Promise<void> {
        const current = await this.redis.llen('captcha:pool');
        const needed = POOL_SIZE - current;
        if (needed <= 0) return;

        const captchas = await Promise.all(
            Array.from({ length: needed }, () => generateCaptcha())
        );

        const pipeline = this.redis.pipeline();
        captchas.forEach(c => pipeline.rpush('captcha:pool', JSON.stringify({
            answer: c.answer,
            options: c.options,
            // toString base64 to save redis space, avoiding huge array representations
            imageBuffer: c.imageBuffer.toString('base64')
        })));
        pipeline.expire('captcha:pool', POOL_TTL);
        await pipeline.exec();
    }
}

const poolRedisUrl = process.env.REDIS_URL?.replace('localhost', '127.0.0.1') || 'redis://127.0.0.1:6379';
const poolRedis = new Redis(poolRedisUrl, {
    maxRetriesPerRequest: null,
    ...(poolRedisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
});
poolRedis.on('error', (err) => {
    // Sadece konsola yazdır, botu çökertmesin
    console.error('[CaptchaPool] Redis Error:', err.message);
});

export const captchaPool = new CaptchaPoolService(poolRedis);
