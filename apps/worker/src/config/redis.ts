import type { ConnectionOptions } from 'bullmq';

export function getRedisConnection(redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'): ConnectionOptions {
  const url = new URL(redisUrl);
  const db = url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : undefined;

  return {
    host: url.hostname || 'localhost',
    port: url.port ? Number(url.port) : 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number.isNaN(db) ? undefined : db,
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}
