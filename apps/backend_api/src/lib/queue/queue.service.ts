import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';

export const WORKO_QUEUE_NAME = 'worko-jobs';

@Injectable()
export class QueueService {
  constructor(@InjectQueue(WORKO_QUEUE_NAME) private readonly queue: Queue) {}

  async enqueue<TPayload>(name: string, payload: TPayload, options?: JobsOptions) {
    return this.queue.add(name, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
      ...options,
    });
  }
}
