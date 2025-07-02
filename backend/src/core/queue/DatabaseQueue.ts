import prisma from '#core/database';
import {
  AbstractQueue,
  type EnnQueueOptions,
  type QueueOptions,
} from '#core/queue/AbstractQueue';
import { Cron } from 'croner';

export class DatabaseQueue<T extends object> extends AbstractQueue<T> {
  private poller: Cron;

  constructor(queue: string, options?: Partial<QueueOptions>) {
    super(queue, options);

    const cronPattern = `*/5 * * * * *`; // Every 5 seconds

    this.poller = new Cron(cronPattern);
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

  public async all() {
    const jobs = await prisma.jobs.findMany({
      where: {
        queue: this.queue,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Ensure the jobs are typed correctly with the payload
    return jobs as ((typeof jobs)[number] & { payload: T })[];
  }

  public async push(payload: T, options: EnnQueueOptions): Promise<void> {
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

    if (!this.poller.isRunning() && !this.poller.isStopped()) {
      this.poller.resume();
    }

    if (!this.poller.isBusy()) {
      await this.poller.trigger();
    }
  }

  public async poll() {
    const job = await prisma.$transaction(async (tx) => {
      // See https://github.com/prisma/prisma/issues/5983
      const rows = await tx.$queryRaw<{ id: string; payload: string }[]>`
        SELECT id, payload
        FROM jobs
        WHERE status = 'PENDING'
          AND run_at <= NOW()
          AND queue = ${this.queue}
        ORDER BY
          priority,
          run_at ASC,
          created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
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

    // If no job was found, pause the poller
    if (job === null) {
      this.poller.pause();
    }

    return job;
  }

  public async complete(id: string): Promise<void> {
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

  public async release(id: string, error: unknown): Promise<void> {
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

  protected async isPollAllowed(): Promise<boolean> {
    const limit = this.options.limit;
    if (!limit) {
      return true;
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
        return true;
      }

      const { tokens, refilled_at: lastRefill } = rows[0];

      const elapsedMs = now.getTime() - lastRefill.getTime();
      const refillRate = limit.max / limit.duration; // tokens per ms
      const refillable = elapsedMs * refillRate;
      const newTokens = Math.min(limit.max, tokens + refillable) - 1;

      if (newTokens < 0) {
        return false;
      }

      await tx.jobRateLimit.update({
        where: { queue: this.queue },
        data: {
          tokens: newTokens,
          refilledAt: now,
        },
      });

      return true;
    });
  }
}
