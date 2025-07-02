import prisma from '#core/database';
import {
  AbstractQueue,
  type EnnQueueOptions,
  type QueueOptions,
} from '#core/Queue/AbstractQueue';
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

  public size(queue?: string): Promise<number> {
    return prisma.jobs.count({
      where: {
        name: queue,
      },
    });
  }

  public async all(queue?: string) {
    const jobs = await prisma.jobs.findMany({
      where: {
        name: queue,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Ensure the jobs are typed correctly with the payload
    return jobs as ((typeof jobs)[number] & { payload: T })[];
  }

  public async push(payload: T, options: EnnQueueOptions): Promise<void> {
    if (!this.poller.isRunning() && !this.poller.isStopped()) {
      this.poller.resume();
    }

    if (!this.poller.isBusy()) {
      await this.poller.trigger();
    }

    const runAt = options.delay
      ? new Date(Date.now() + options.delay)
      : new Date();

    await prisma.jobs.create({
      data: {
        name: this.queue,
        status: 'PENDING',
        runAt,
        payload,
      },
    });
  }

  public async poll() {
    const job = await prisma.$transaction(async (tx) => {
      // See https://github.com/prisma/prisma/issues/5983
      const rows = await tx.$queryRaw<{ id: string; payload: string }[]>`
        SELECT id, payload
        FROM jobs
        WHERE status = 'PENDING'
          AND run_at <= NOW()
          AND name = ${this.queue}
        ORDER BY run_at ASC, created_at ASC LIMIT 1
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
        name: this.queue,
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
        name: this.queue,
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
}
