import prisma from '#core/database';
import {
  type JobOptions,
  Queue,
  type QueueOptions,
  type Job,
  type JobStatus,
} from '#core/queue/Queue';
import { Cron } from 'croner';
import logger from '#core/logger';

export class DatabaseQueue<T extends object> extends Queue<T> {
  private poller: Cron;
  private handler: ((payload: T) => Promise<void>) | null = null;

  constructor(queue: string, options?: Partial<QueueOptions>) {
    super(queue, options);

    const cronPattern = `*/5 * * * * *`; // Every 5 seconds

    this.poller = new Cron(cronPattern, this.run.bind(this), {
      name: this.queue + '-poller',
      paused: true,
      protect: (job) => {
        const startTime = job.currentRun()?.toISOString();
        logger.warning(
          `Job poller ${job.name ?? '??'} was blocked by call started at ${startTime ?? '??'}`,
        );
      },
      catch: (error, job) => {
        logger.error(
          `Job poller ${job.name ?? '??'} failed. ${JSON.stringify(error)}`,
        );
      },
    });
  }

  private async run() {
    if (!this.handler) {
      return;
    }

    const job = await this.poll();

    if (job === null) {
      return;
    }

    try {
      await this.handler(job.payload);

      await this.complete(job.id);
    } catch (error) {
      await this.release(job.id, error);
    }
  }

  protected retryTime(attempts: number): Date {
    const delay =
      this.options.retryDelayType === 'exponential'
        ? this.options.retryDelay * Math.pow(2, attempts - 1)
        : this.options.retryDelay;

    return new Date(Date.now() + delay);
  }

  public size(): Promise<number> {
    return prisma.jobs.count({
      where: {
        queue: this.queue,
      },
    });
  }

  public async all(status?: JobStatus): Promise<Job<T>[]> {
    const jobs = await prisma.jobs.findMany({
      where: {
        queue: this.queue,
        status: status === 'DELAYED' ? 'PENDING' : status,
        runAt: status === 'DELAYED' ? { gt: new Date() } : undefined,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const isDelayed = (job: (typeof jobs)[number]) => {
      return (
        job.status === 'PENDING' && (job.runAt?.getTime() ?? 0) > Date.now()
      );
    };

    return jobs.map((job) => {
      const status = isDelayed(job) ? 'DELAYED' : job.status;

      return {
        ...job,
        status,
        payload: job.payload as T,
      };
    });
  }

  public process(handler: (payload: T) => Promise<void>): void | Promise<void> {
    this.handler = handler;
  }

  async add(payload: T, options: JobOptions): Promise<void> {
    const runAt = options.delay
      ? new Date(Date.now() + options.delay)
      : new Date();

    await prisma.jobs.create({
      data: {
        queue: this.queue,
        status: 'PENDING',
        priority: options.priority,
        runAt,
        payload,
      },
    });
  }

  async poll() {
    if (await this.isRateLimitExceeded()) {
      return null;
    }

    return prisma.$transaction(async (tx) => {
      // See https://github.com/prisma/prisma/issues/5983
      const rows = await tx.$queryRaw<{ id: string; payload: string }[]>`
        SELECT id, payload
        FROM jobs
        WHERE status = 'PENDING'
          AND run_at <= NOW()
          AND queue = ${this.queue}
          AND reserved_at IS NULL
        ORDER BY priority,
                 run_at ASC,
                 created_at ASC LIMIT 1
        FOR
        UPDATE SKIP LOCKED
      `;

      if (rows.length === 0) {
        return null;
      }

      const job = rows[0];

      await tx.jobs.update({
        where: { id: job.id },
        data: {
          status: 'RUNNING',
          attempts: {
            increment: 1,
          },
          error: null,
          reservedAt: new Date(),
        },
      });

      return {
        id: job.id,
        payload: JSON.parse(job.payload) as T,
      };
    });
  }

  async complete(id: string): Promise<void> {
    await prisma.jobs.update({
      where: {
        id,
        status: 'RUNNING',
        queue: this.queue,
      },
      data: {
        status: 'COMPLETED',
        reservedAt: null,
        error: null,
        finishedAt: new Date(),
      },
    });
  }

  async release(id: string, error: unknown): Promise<void> {
    const job = await prisma.jobs.findUnique({
      where: {
        id,
        queue: this.queue,
      },
      select: {
        attempts: true,
      },
    });

    if (!job) {
      throw new Error(`Job with id ${id} not found`);
    }

    if (job.attempts >= this.options.maxAttempts) {
      // If the job has reached the maximum number of attempts, mark it as failed
      await prisma.jobs.update({
        where: { id },
        data: {
          status: 'FAILED',
          reservedAt: null,
          runAt: null,
          error: error ?? null,
          finishedAt: new Date(),
        },
      });
      return;
    }

    await prisma.jobs.update({
      where: { id },
      data: {
        status: 'PENDING',
        reservedAt: null,
        error: error ?? null,
        runAt: this.retryTime(job.attempts),
        finishedAt: new Date(),
      },
    });
  }

  private async isRateLimitExceeded(): Promise<boolean> {
    const limit = this.options.limit;
    if (!limit) {
      return false;
    }

    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const rows = await tx.$queryRaw<{ tokens: number; refilled_at: Date }[]>`
        SELECT tokens, refilled_at
        FROM rate_limits
        WHERE queue = ${this.queue}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        await tx.jobRateLimit.create({
          data: {
            queue: this.queue,
            tokens: limit.max - 1,
            refilledAt: new Date(),
          },
        });
        return false;
      }

      const { tokens, refilled_at: lastRefill } = rows[0];

      const elapsedMs = now.getTime() - lastRefill.getTime();
      const refillRate = limit.max / limit.duration; // tokens per ms
      const refillable = elapsedMs * refillRate;
      const newTokens = Math.min(limit.max, tokens + refillable) - 1;

      if (newTokens < 0) {
        return true;
      }

      await tx.jobRateLimit.update({
        where: { queue: this.queue },
        data: {
          tokens: newTokens,
          refilledAt: now,
        },
      });

      return false;
    });
  }

  public close() {
    this.poller.stop();
  }

  public pause() {
    this.poller.pause();
  }

  public resume() {
    this.poller.resume();
  }
}
