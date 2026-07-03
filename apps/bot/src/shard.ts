import { ShardingManager } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env dosyasını monorepo kök dizininden yükle
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const botFile = path.join(__dirname, __filename.endsWith('.ts') ? 'index.ts' : 'index.js');
const execArgv = __filename.endsWith('.ts') ? ['--import', 'tsx'] : [];

const manager = new ShardingManager(botFile, {
    totalShards: 'auto',
    token: process.env.DISCORD_TOKEN,
    respawn: true, // Discord.js'in kendi güvenli respawn mekanizmasını kullanıyoruz
    execArgv,
});

manager.on('shardCreate', shard => {
    console.log(`[Shard ${shard.id}] Başlatıldı`);
    
    shard.on('death', () => {
        console.error(`[Shard ${shard.id}] Öldü. Discord.js tarafından otomatik olarak yeniden başlatılıyor...`);
    });
    
    shard.on('disconnect', () => {
        console.warn(`[Shard ${shard.id}] Bağlantı kesildi`);
    });
});

// Shard error handler
(manager as any).on('shardError', async (error: any, shardId: number) => {
    if (error?.message?.includes('429')) {
        console.warn(`[Shard ${shardId}] Discord rate limit — 30 saniye bekleniyor`);
    }
});

// Spawn mekanizmasını retry loop içerisine alıyoruz
async function spawnWithRetry() {
    try {
        await manager.spawn();
    } catch (err: any) {
        console.error('[ShardingManager] Spawn Error:', err);
        
        // 429 hatası veya süreç ölmesi durumunda 30 saniye bekleyip baştan deneyeceğiz
        if (err?.status === 429 || err?.message?.includes('429') || err?.code === 'ShardingReadyDied') {
            const retryAfter = err?.headers?.get('retry-after') || 30;
            const waitTime = Math.max(Number(retryAfter) * 1000, 30_000);
            
            console.warn(`[ShardingManager] Discord rate limit hit during spawn. Retrying in ${waitTime}ms...`);
            setTimeout(spawnWithRetry, waitTime);
        } else {
            // Diğer bilinmeyen hatalarda 15 sn sonra tekrar dene
            console.warn('[ShardingManager] Bilinmeyen spawn hatası. 15 saniye sonra tekrar deneniyor...');
            setTimeout(spawnWithRetry, 15_000);
        }
    }
}

spawnWithRetry();
