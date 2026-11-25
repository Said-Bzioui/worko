import { Worker, type Job } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';
import type { JobHandler } from '../jobs/job.types.js';
import { NotificationJobHandler } from '../jobs/notification.job.js';

export const WORKO_QUEUE_NAME = 'worko-jobs';

export function createWorkoWorker(): Worker {
  const handlers: JobHandler[] = [new NotificationJobHandler()];
  const handlerMap = new Map<string, JobHandler>(handlers.map((h) => [h.name, h]));

  const worker = new Worker(
    WORKO_QUEUE_NAME,
    async (job: Job) => {
      const handler = handlerMap.get(job.name);
      if (!handler) {
        throw new Error(`No handler registered for job "${job.name}"`);
      }
      await handler.handle(job.data, {
        jobId: job.id ?? 'unknown',
        attempt: job.attemptsMade + 1,
      });
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id ?? 'unknown'} (${job?.name ?? 'unknown'}) failed:`, err);
  });

  return worker;
}
