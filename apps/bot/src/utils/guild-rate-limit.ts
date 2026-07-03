import Redis from 'ioredis';

export async function checkGuildRateLimit(options: {
  redis: Redis;
  guildId: string;
  action: string;
  maxPerMinute: number;
}): Promise<boolean> {
  const { redis, guildId, action, maxPerMinute } = options;
  const key = `rate_limit:guild:${guildId}:${action}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= maxPerMinute;
}
