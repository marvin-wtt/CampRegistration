export interface QueueOptions {
  maxAttempts: number;
  retryDelay: number; // milliseconds
  retryDelayType: 'fixed' | 'exponential';
  stallTimeout: number; // milliseconds
  limit?: {
    max: number;
    duration: number; // in milliseconds
  };
  repeat?: (
    | {
        cron: string; // Cron expression
      }
    | {
        interval: number; // Interval in milliseconds
      }
  ) & { limit?: number };
}

export interface JobOptions {
  delay?: number;
  priority?: number; // 1 is the highest
}

export type JobStatus =
  | 'DELAYED'
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

export interface Job<T> {
  id: string;
  name: string;
  queue: string;
  status: JobStatus;
  payload: T;
  reservedAt: Date | null;
  runAt: Date | null;
  finishedAt: Date | null;
  error: unknown;
  attempts: number;
}

export abstract class Queue<P, R = void, N extends string = string> {
  protected readonly options: QueueOptions = {
    maxAttempts: 5,
    stallTimeout: 60 * 1000,
    retryDelay: 5000,
    retryDelayType: 'exponential',
  };

  protected constructor(
    protected queue: string,
    options?: Partial<QueueOptions>,
  ) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  public abstract process(
    handler: (payload: P) => Promise<R>,
  ): void | Promise<void>;

  public abstract all(status?: JobStatus): Promise<Job<P>[]>;

  public abstract add(name: N, payload: P, options?: JobOptions): Promise<void>;

  public abstract close(): Promise<void> | void;

  public abstract pause(): Promise<void> | void;

  public abstract resume(): Promise<void> | void;
}
