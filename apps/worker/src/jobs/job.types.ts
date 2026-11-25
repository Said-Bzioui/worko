export interface JobContext {
  jobId: string;
  attempt: number;
}

export interface JobHandler<TPayload = unknown> {
  readonly name: string;
  handle(payload: TPayload, context: JobContext): Promise<void>;
}
