import { join } from 'path';
import type { Guild } from 'discord.js';

const DEFAULT_BANNER_PATH = join(__dirname, '../../assets/DefaultBanner.png');

export function getBannerPath(guildId: string): string {
    return DEFAULT_BANNER_PATH;
}

export async function ensureBanner(guild: Guild, force = false): Promise<string> {
    return DEFAULT_BANNER_PATH;
}
