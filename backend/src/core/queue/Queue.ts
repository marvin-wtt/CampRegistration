import { runWithJobContext } from '#core/context/jobContext';
import logger from '#core/logger';
import { describeError } from '#utils/errors';

export interface QueueOptions {
  maxAttempts: number;
  retryDelay: number; // milliseconds
  retryDelayType: 'fixed' | 'exponential';
  stalledInterval: number; // milliseconds
  maxStalledCount: number;
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
  'DELAYED' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface SimpleJob<T> {
  name: string;
  payload: T;
}

/** A claimed job, as a driver hands it over for execution. */
export interface QueuedJob<T> extends SimpleJob<T> {
  id: string;
  /** 1-based, including the current attempt. */
  attempt: number;
}

export interface Job<T> extends SimpleJob<T> {
  id: string;
  queue: string;
  status: JobStatus;
  reservedAt: Date | null;
  runAt: Date | null;
  finishedAt: Date | null;
  error: unknown;
  attempts: number;
}

export interface QueueJobCounts {
  active: number;
  failed: number;
  pending: number;
  delayed: number;
}

export abstract class Queue<P, R = void, N extends string = string> {
  protected readonly options: QueueOptions = {
    maxAttempts: 5,
    stalledInterval: 30_1000,
    maxStalledCount: 1,
    retryDelay: 5000,
    retryDelayType: 'exponential',
  };

  constructor(
    protected queue: string,
    options?: Partial<QueueOptions>,
  ) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  public get name(): string {
    return this.queue;
  }

  public process(handler: (job: SimpleJob<P>) => Promise<R>): void {
    this.consume((job) => this.execute(job, handler));
  }

  /**
   * Driver hook: deliver claimed jobs to `run`. A rejection means the attempt
   * failed and is already logged; the driver only handles retry bookkeeping.
   */
  protected abstract consume(run: (job: QueuedJob<P>) => Promise<R>): void;

  // Every attempt runs inside its job context, so all logs it produces —
  // including its failure below — are attributable to the job.
  private execute(
    job: QueuedJob<P>,
    handler: (job: SimpleJob<P>) => Promise<R>,
  ): Promise<R> {
    const context = {
      source: 'queue' as const,
      queue: this.queue,
      name: job.name,
      id: job.id,
      attempt: job.attempt,
    };

    return runWithJobContext(context, async () => {
      try {
        return await handler({ name: job.name, payload: job.payload });
      } catch (error) {
        const attempt = job.attempt.toString();
        if (job.attempt < this.options.maxAttempts) {
          logger.warn(
            `Job failed on attempt ${attempt}, retrying: ${describeError(error)}`,
          );
        } else {
          logger.error(`Job failed after ${attempt} attempts:`, error);
        }
        throw error;
      }
    });
  }

  public abstract get type(): string;

  public abstract all(status?: JobStatus): Promise<Job<P>[]>;

  public abstract count(): Promise<number>;

  public abstract jobCounts(): Promise<QueueJobCounts>;

  public abstract retryFailed(): Promise<void>;

  public abstract deleteFailed(): Promise<void>;

  public abstract add(name: N, payload: P, options?: JobOptions): Promise<void>;

  public abstract addBulk(
    jobs: { name: N; payload: P; options?: JobOptions }[],
  ): Promise<void>;

  public abstract close(): Promise<void> | void;

  public abstract pause(): Promise<void> | void;

  public abstract resume(): Promise<void> | void;
}
