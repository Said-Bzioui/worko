import type { JobContext, JobHandler } from './job.types.js';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
}

export class NotificationJobHandler implements JobHandler<NotificationPayload> {
  readonly name = 'notification.send';

  async handle(payload: NotificationPayload, context: JobContext): Promise<void> {
    console.log(
      `[worker:${this.name}] Processing job ${context.jobId} (attempt ${context.attempt}) for user=${payload.userId}: ${payload.title}`,
    );
  }
}
