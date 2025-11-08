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

type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export class DatabaseQueue<P, R, N extends string> extends Queue<P, R, N> {
  private poller: Cron;
  private handler: ((payload: P) => Promise<R>) | null = null;

  constructor(queue: string, options?: Partial<QueueOptions>) {
    super(queue, options);

    const cronPattern = `*/5 * * * * *`; // Every 5 seconds

    this.poller = new Cron(cronPattern, this.run.bind(this), {
      name: this.queue + '-poller',
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

  public async all(status?: JobStatus): Promise<Job<P>[]> {
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
        payload: job.payload as P,
      };
    });
  }

  public process(handler: (payload: P) => Promise<R>): void | Promise<void> {
    this.handler = handler;
  }

  async add(name: N, payload: P, options?: JobOptions): Promise<void> {
    const runAt = options?.delay
      ? new Date(Date.now() + options.delay)
      : new Date();

    await prisma.jobs.create({
      data: {
        name,
        queue: this.queue,
        status: 'PENDING',
        priority: options?.priority,
        runAt,
        payload,
      },
    });
  }

  async poll() {
    await this.handleStalled();

    return prisma.$transaction(async (tx) => {
      if (await this.isRateLimitExceeded(tx)) {
        return null;
      }

      const rows = await tx.$queryRaw<{ id: string; payload: string }[]>`
        SELECT id, payload
        FROM jobs
        WHERE status = 'PENDING'
          AND run_at <= NOW()
          AND queue = ${this.queue}
          AND reserved_at IS NULL
        ORDER BY priority, run_at, created_at
        LIMIT 1
        FOR
        UPDATE
        SKIP LOCKED
      `;

      if (rows.length === 0) {
        return null;
      }

      const job = rows[0];

      await tx.jobs.update({
        where: { id: job.id },
        data: {
          status: 'RUNNING',
          attempts: { increment: 1 },
          error: null,
          reservedAt: new Date(),
        },
      });

      return {
        id: job.id,
        payload: JSON.parse(job.payload) as P,
      };
    });
  }

  async handleStalled(): Promise<void> {
    await prisma.jobs.updateMany({
      where: {
        queue: this.queue,
        status: 'RUNNING',
        reservedAt: { lt: new Date(Date.now() - this.options.stallTimeout) },
      },
      data: {
        status: 'PENDING',
        reservedAt: null,
        runAt: new Date(),
      },
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
      where: { id },
      select: {
        attempts: true,
        queue: true,
      },
    });

    if (!job) {
      throw new Error(`Job with id ${id} not found`);
    }

    if (job.queue !== this.queue) {
      throw new Error(`Job with id ${id} is not in this queue`);
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
        finishedAt: null,
      },
    });
  }

  private async isRateLimitExceeded(tx: PrismaTransaction): Promise<boolean> {
    const limit = this.options.limit;
    if (!limit) {
      return false;
    }

    const now = new Date();

    const rows = await tx.$queryRaw<{ tokens: number; refilled_at: Date }[]>`
        SELECT tokens, refilled_at
        FROM job_rate_limits
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
    const refillable = Math.floor(tokens + elapsedMs * refillRate);
    const available = Math.min(limit.max, refillable);

    if (available <= 0) {
      return true;
    }

    await tx.jobRateLimit.update({
      where: { queue: this.queue },
      data: {
        tokens: available - 1,
        refilledAt: now,
      },
    });

    return false;
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
