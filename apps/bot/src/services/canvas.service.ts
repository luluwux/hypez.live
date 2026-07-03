import { createCanvas, loadImage } from '@napi-rs/canvas';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Guild } from 'discord.js';


const CANVAS_W = 960;
const CANVAS_H = 160;


async function drawBackground(ctx: SKRSContext2D, guild: Guild): Promise<void> {
    let url = guild.bannerURL({ size: 1024, extension: 'png' });
    if (!url) url = guild.iconURL({ size: 1024, extension: 'png' });

    if (url) {
        try {
            const img = await loadImage(url);
            
            // Bulanıklık ve karartma filtresi ekle
            ctx.filter = 'blur(6px) brightness(40%)';
            
            // Resmi canvas'a orantılı bir şekilde cover olacak şekilde çiz (CSS object-fit: cover gibi)
            const scale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (CANVAS_W - w) / 2;
            const y = (CANVAS_H - h) / 2;
            
            ctx.drawImage(img, x, y, w, h);
            ctx.filter = 'none'; // Filtreyi sıfırla
            return;
        } catch {
            // Yükleme başarısız olursa fallback'e düş
        }
    }
    
    // Fallback arka plan (Eğer resim veya banner yoksa)
    drawFallbackBackground(ctx);
}

function drawFallbackBackground(ctx: SKRSContext2D): void {
    const bg = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    bg.addColorStop(0, '#030d1a');
    bg.addColorStop(1, '#0c1f3f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}


function drawText(ctx: SKRSContext2D, serverName: string): void {
    let size = 64;
    ctx.font = `bold ${size}px sans-serif`;
    
    // Metin canvasa sığana kadar küçült
    while (ctx.measureText(serverName).width > CANVAS_W - 80 && size > 24) {
        size -= 2;
        ctx.font = `bold ${size}px sans-serif`;
    }
    
    // Gradient metin rengi
    const textGrad = ctx.createLinearGradient(0, (CANVAS_H / 2) - 40, 0, (CANVAS_H / 2) + 40);
    textGrad.addColorStop(0, '#ffffff');
    textGrad.addColorStop(1, '#e2e8f0');
    
    ctx.fillStyle = textGrad;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Gölgelendirme (Daha iyi okunabilirlik için)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    ctx.fillText(serverName, CANVAS_W / 2, CANVAS_H / 2);
    
    // Gölgelendirmeyi sıfırla
    ctx.shadowBlur = 0;
}


/**
 * Guild'e özel 960×160 PNG banner üretir ve Buffer döndürür.
 * Sadece merkezlenmiş isim ve bulanık arka plan bulunur.
 */
export async function generateServerBanner(guild: Guild): Promise<Buffer> {
    const canvas = createCanvas(CANVAS_W, CANVAS_H);
    const ctx = canvas.getContext('2d');

    await drawBackground(ctx, guild);
    drawText(ctx, guild.name);

    return canvas.toBuffer('image/png');
}
