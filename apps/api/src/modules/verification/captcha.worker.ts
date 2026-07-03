import { createCanvas } from '@napi-rs/canvas';

// Helper for random string
function randomString(len: number, chars: string) {
    let res = '';
    for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
}

// Helper for mutations
function mutateString(str: string, numbersOnly: boolean) {
    const chars = numbersOnly ? '23456789' : 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const arr = str.split('');
    const mutations = Math.random() > 0.5 ? 1 : 2;
    for (let i = 0; i < mutations; i++) {
        const idx = Math.floor(Math.random() * arr.length);
        arr[idx] = chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return arr.join('');
}

// Ensure CaptchaTier enum is available or mirrored
const CaptchaTier = {
    CRITICAL: 'CRITICAL',
    NORMAL: 'NORMAL',
    TRUSTED: 'TRUSTED'
};

// Piscina entry point
export default async function generate({ tier, id }: { tier: string, id: string }) {
    try {
        let text = '';
        let width = 450;
        let height = 180;
        let fontSize = 60;
        let decoys = 5;
        let traceSize = 2;

        if (tier === CaptchaTier.CRITICAL) {
            text = randomString(8, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
            decoys = 30;
            traceSize = 5;
        } else if (tier === CaptchaTier.NORMAL) {
            text = randomString(5, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
            decoys = 20;
            traceSize = 4;
        } else {
            text = randomString(4, '23456789');
            decoys = 15;
            traceSize = 3;
        }

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Decoys
        for (let i = 0; i < decoys; i++) {
            ctx.font = `bold 40px sans-serif`;
            ctx.fillStyle = `rgba(100, 116, 139, 0.7)`;
            ctx.fillText(
                randomString(1, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'),
                Math.random() * width,
                Math.random() * height
            );
        }

        // Traces (Lines)
        for (let i = 0; i < traceSize * 2; i++) {
            ctx.beginPath();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.bezierCurveTo(
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height
            );
            ctx.stroke();
        }

        // Text
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = '#3b82f6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textArr = text.split('');
        const charWidth = 40;
        const startX = (width - (textArr.length * charWidth)) / 2;
        
        textArr.forEach((char, i) => {
            ctx.save();
            ctx.translate(startX + (i * charWidth) + 20, height / 2 + (Math.random() - 0.5) * 20);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        });

        const buffer = canvas.toBuffer('image/png');

        const options = new Set<string>();
        options.add(text);
        while (options.size < 5) {
            const decoy = mutateString(text, tier === CaptchaTier.TRUSTED);
            if (decoy !== text) options.add(decoy);
        }

        // Return result directly. Piscina handles transfer back to main thread.
        return {
            id,
            imageBuffer: buffer,
            answer: text,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            tier,
            createdAt: Date.now()
        };

    } catch (error) {
        console.error('Worker Error:', error);
        throw error;
    }
}
