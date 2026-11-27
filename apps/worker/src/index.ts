import 'dotenv/config';
import { createPrismaClient } from '@worko/database';
import type { Worker } from 'bullmq';
import { createWorkoWorker, WORKO_QUEUE_NAME } from './queues/worko.worker.js';

const prisma = createPrismaClient(process.env.DATABASE_URL!);
let worker: Worker | undefined;

async function bootstrap() {
  await prisma.$connect();
  console.log('[worker] Connected to PostgreSQL via @worko/database');

  worker = createWorkoWorker();
  console.log(`[worker] BullMQ worker listening on queue "${WORKO_QUEUE_NAME}"`);
}

async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}, shutting down...`);
  if (worker) {
    await worker.close();
  }
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

bootstrap().catch(async (error: unknown) => {
  console.error('[worker] Failed to start:', error);
  if (worker) {
    await worker.close();
  }
  await prisma.$disconnect();
  process.exit(1);
});
