import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import type { ConnectionOptions } from 'bullmq';
import { QueueService, WORKO_QUEUE_NAME } from './queue.service.js';

function getRedisConnection(redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'): ConnectionOptions {
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

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    BullModule.registerQueue({
      name: WORKO_QUEUE_NAME,
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
