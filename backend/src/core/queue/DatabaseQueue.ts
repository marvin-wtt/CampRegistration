import prisma from '#core/database';
import {
  type JobOptions,
  Queue,
  type Job,
  type JobStatus,
} from '#core/queue/Queue';
import logger from '#core/logger';

type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export class DatabaseQueue<P, R, N extends string> extends Queue<P, R, N> {
  public readonly type = 'database';

  private handler: ((payload: P) => Promise<R>) | null = null;
  private sleepResolve: (() => void) | null = null;
  private running = false;

  private minSleepMs = 200;
  private maxSleepMs = 2000;
  private minErrorBackoffMs = 1000;
  private maxErrorBackoffMs = 30000;

  public start() {
    if (this.running) {
      return;
    }
    this.running = true;

    this.workerLoop().catch((error: unknown) => {
      logger.error(
        `Fatal for queue ${this.queue} crashed: ${errorMessage(error)}`,
      );
    });
  }

  public close() {
    this.running = false;
  }

  public pause() {
    this.running = false;
  }

  public resume() {
    if (!this.running) {
      this.start();
    }
  }

  public process(handler: (payload: P) => Promise<R>): void {
    if (this.handler != null) {
      logger.warn('Queue handler already defined, overwriting it.');
    }

    this.handler = handler;
    if (!this.running) {
      this.start();
    }
  }

  public async add(name: N, payload: P, options?: JobOptions): Promise<void> {
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

    this.wake();
  }

  private async workerLoop() {
    let sleepMs = 0;
    let errorSleepMs = 0;

    while (this.running) {
      if (!this.handler) {
        logger.info(
          `Worker for queue ${this.queue} stopped (no handler defined)`,
        );
        this.pause();
        return;
      }

      try {
        await this.handleStalled();

        const job = await this.poll();
        if (!job) {
          sleepMs =
            sleepMs === 0
              ? this.minSleepMs
              : Math.min(this.maxSleepMs, sleepMs * 2);

          await this.sleep(sleepMs);
          continue;
        }

        sleepMs = 0;
        errorSleepMs = 0;

        await this.processJob(job);
      } catch (error) {
        errorSleepMs =
          errorSleepMs === 0
            ? this.minErrorBackoffMs
            : Math.min(this.maxErrorBackoffMs, errorSleepMs * 2);

        logger.error(
          `Worker for queue ${this.queue} encountered an error: ${errorMessage(error)}`,
        );
        await this.sleep(errorSleepMs);
      }
    }

    logger.info(`Worker for queue ${this.queue} stopped`);
  }

  private async processJob(job: { id: string; payload: P }) {
    if (!this.handler) {
      throw new Error('No handler defined for the queue');
    }

    try {
      await this.handler(job.payload);

      await this.complete(job.id);
    } catch (err) {
      logger.warn(
        `Job ${job.id} in queue ${this.queue} failed: ${errorMessage(err)}`,
      );

      await this.release(job.id, err);
    }
  }

  private sleep(ms: number) {
    if (ms <= 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) {
          return;
        }
        resolved = true;
        clearTimeout(t);
        if (this.sleepResolve === done) {
          this.sleepResolve = null;
        }
        resolve();
      };
      const t = setTimeout(done, ms);
      this.sleepResolve = done;
    });
  }

  private wake() {
    if (this.sleepResolve) {
      this.sleepResolve();
    }
  }

  public count(): Promise<number> {
    return prisma.jobs.count({ where: { queue: this.queue } });
  }

  public async all(status?: JobStatus): Promise<Job<P>[]> {
    const jobs = await prisma.jobs.findMany({
      where: {
        queue: this.queue,
        status: status === 'DELAYED' ? 'PENDING' : status,
        runAt: status === 'DELAYED' ? { gt: new Date() } : undefined,
      },
      orderBy: { createdAt: 'asc' },
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

  async handleStalled(): Promise<void> {
    await prisma.jobs.updateMany({
      where: {
        queue: this.queue,
        status: 'RUNNING',
        reservedAt: { lt: new Date(Date.now() - this.options.stalledInterval) },
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
      select: { attempts: true, queue: true },
    });

    if (!job) {
      throw new Error(`Failed to release job with id ${id}: Not found`);
    }

    if (job.queue !== this.queue) {
      throw new Error(
        `Failed to release job with id ${id}: Job is not in this queue`,
      );
    }

    if (job.attempts >= this.options.maxAttempts) {
      // If the job has reached the maximum number of attempts, mark it as failed
      await prisma.jobs.update({
        where: { id },
        data: {
          status: 'FAILED',
          reservedAt: null,
          runAt: null,
          error: errorOrNull(error),
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
        error: errorOrNull(error),
        runAt: this.retryTime(job.attempts),
        finishedAt: null,
      },
    });
  }

  protected retryTime(attempts: number): Date {
    const delay =
      this.options.retryDelayType === 'exponential'
        ? this.options.retryDelay * Math.pow(2, attempts - 1)
        : this.options.retryDelay;
    ('');
    return new Date(Date.now() + delay);
  }

  async poll() {
    return prisma.$transaction(async (tx) => {
      if (await this.isRateLimitExceeded(tx)) {
        return null;
      }

      const rows = await tx.$queryRaw<{ id: string; payload: string }[]>`
        SELECT id, payload
        FROM jobs
        WHERE status = 'PENDING'
          AND run_at <= NOW(3)
          AND queue = ${this.queue}
          AND reserved_at IS NULL
        ORDER BY priority, run_at, created_at
        LIMIT 1
        FOR UPDATE
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

  private async isRateLimitExceeded(tx: PrismaTransaction): Promise<boolean> {
    const limit = this.options.limit;
    if (!limit) {
      return false;
    }

    const now = new Date();

    await tx.jobRateLimit.upsert({
      where: { queue: this.queue },
      create: { queue: this.queue, tokens: limit.max, refilledAt: now },
      update: {},
    });

    const rows = await tx.$queryRaw<{ tokens: number; refilled_at: Date }[]>`
        SELECT tokens, refilled_at
        FROM job_rate_limits
        WHERE queue = ${this.queue}
          FOR UPDATE
      `;

    if (rows.length === 0) {
      return false;
    }

    const { tokens, refilled_at: lastRefill } = rows[0];

    const elapsedMs = now.getTime() - lastRefill.getTime();
    const refillRate = limit.max / limit.duration;
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
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }

  if (typeof e === 'string') {
    return e;
  }

  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function errorOrNull(error: unknown): string | null {
  if (error == null) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Error object could not be serialized';
  }
}
