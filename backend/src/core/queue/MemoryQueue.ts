import { randomUUID } from 'node:crypto';
import {
  type Job,
  Queue,
  type SimpleJob,
  type JobStatus,
  type JobOptions,
} from '#core/queue/Queue.js';
import logger from '#core/logger';

type InternalJob<P> = Job<P> & {
  priority: number; // default 100
  stalledCount: number;
};

export class MemoryQueue<P, R, N extends string> extends Queue<P, R, N> {
  public readonly type = 'memory';

  private handler: ((job: SimpleJob<P>) => Promise<R>) | null = null;

  private jobs = new Map<string, InternalJob<P>>();
  private paused = false;

  // worker loop
  private tickTimer: NodeJS.Timeout | null = null;
  private repeatTimer: NodeJS.Timeout | null = null;
  private closed = false;

  // simple rate limiting window
  private windowStartedAt = Date.now();
  private windowCount = 0;

  // retention to avoid unbounded memory growth
  // keep ALL unfinished jobs + last N finished (completed/failed)
  private finishedRetention = 1000;

  public process(handler: (job: SimpleJob<P>) => Promise<R>): void {
    this.assertOpen();
    this.handler = handler;
    this.start();
  }

  public all(status?: JobStatus): Promise<Job<P>[]> {
    const arr = Array.from(this.jobs.values());
    const filtered = status ? arr.filter((j) => j.status === status) : arr;

    return Promise.resolve(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      filtered.map(({ priority, stalledCount, ...rest }) => rest),
    );
  }

  public count(): Promise<number> {
    // Redis-like behaviour: only unfinished jobs
    const count = Array.from(this.jobs.values()).filter(
      (j) =>
        j.status === 'DELAYED' ||
        j.status === 'PENDING' ||
        j.status === 'RUNNING',
    ).length;

    return Promise.resolve(count);
  }

  public add(name: N, payload: P, options?: JobOptions): Promise<void> {
    this.assertOpen();

    const now = Date.now();
    const delayMs = Math.max(0, options?.delay ?? 0);
    const runAt = delayMs > 0 ? new Date(now + delayMs) : null;

    const priority = this.normalizePriority(options?.priority);

    const job: InternalJob<P> = {
      id: randomUUID(),
      queue: this.queue,
      name,
      payload,
      status: delayMs > 0 ? 'DELAYED' : 'PENDING',
      reservedAt: null,
      runAt,
      finishedAt: null,
      error: null,
      attempts: 0,
      priority,
      stalledCount: 0,
    };

    this.jobs.set(job.id, job);

    return Promise.resolve();
  }

  public close(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.stopTick();
    this.stopRepeat();
    this.handler = null;
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  private start(): void {
    this.assertOpen();

    // main tick: small interval keeps latency low but not insane
    this.tickTimer ??= setInterval(() => {
      void this.tick();
    }, 50);

    // optional repeat support (interval only)
    this.startRepeatIfConfigured();
  }

  private stopTick(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private stopRepeat(): void {
    if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
  }

  private startRepeatIfConfigured(): void {
    const rep = this.options.repeat;
    if (!rep) {
      return;
    }

    if ('cron' in rep) {
      throw new Error(
        'MemoryQueue: options.repeat.cron is not supported without a cron parser.',
      );
    }

    if (this.repeatTimer) {
      return;
    }

    const interval = Math.max(1, rep.interval);
    const limit = rep.limit;

    let created = 0;

    this.repeatTimer = setInterval(() => {
      if (this.closed) {
        return;
      }

      if (typeof limit === 'number' && created >= limit) {
        this.stopRepeat();
        return;
      }

      created++;

      // Repeat does not define what to enqueue, so we enqueue a conventional "repeat" job.
      // You can handle it in your worker by checking job.name === '__repeat__'.
      void this.add('__repeat__' as N, undefined as unknown as P);
    }, interval);
  }

  private async tick(): Promise<void> {
    if (this.closed || this.paused || !this.handler) {
      return;
    }

    const now = Date.now();

    // move DELAYED -> PENDING when runAt is reached
    for (const job of this.jobs.values()) {
      if (job.status === 'DELAYED' && job.runAt && job.runAt.getTime() <= now) {
        job.status = 'PENDING';
        job.runAt = null;
      }
    }

    // detect stalled jobs
    this.detectAndHandleStalls(now);

    // respect global rate limit (per queue instance)
    if (!this.canRunAnotherJob(now)) {
      return;
    }

    const next = this.pickNextRunnableJob();
    if (!next) {
      return;
    }

    // reserve + run
    next.status = 'RUNNING';
    next.reservedAt = new Date(now);
    next.attempts += 1;

    // increment rate limit window usage
    this.windowCount += 1;

    try {
      // IMPORTANT: do not pass internal fields to handler
      await this.handler({ name: next.name, payload: next.payload });

      next.status = 'COMPLETED';
      next.finishedAt = new Date();
      next.error = null;
      next.reservedAt = null;
      next.stalledCount = 0;

      this.pruneFinished();
    } catch (err) {
      next.error = this.stringifyError(err);
      next.reservedAt = null;

      if (next.attempts >= this.options.maxAttempts) {
        next.status = 'FAILED';
        next.finishedAt = new Date();
        this.pruneFinished();

        logger.error(
          `Job ${next.id} failed after ${next.attempts.toString()} attempts: ${next.error as string}`,
        );
        return;
      }

      // schedule retry
      const delay = this.computeRetryDelayMs(next.attempts);
      next.status = 'DELAYED';
      next.runAt = new Date(Date.now() + delay);

      logger.warn(
        `Job ${next.id} failed: ${next.error as string}. Retrying in ${delay.toString()}ms.`,
      );
    }
  }

  private pickNextRunnableJob(): InternalJob<P> | null {
    const pending = Array.from(this.jobs.values()).filter(
      (j) => j.status === 'PENDING',
    );

    if (pending.length === 0) {
      return null;
    }

    // priority asc (1 is highest), then stable-ish tie-breaker by id
    pending.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id.localeCompare(b.id);
    });

    return pending[0] ?? null;
  }

  private detectAndHandleStalls(now: number): void {
    const interval = this.options.stalledInterval;

    for (const job of this.jobs.values()) {
      if (job.status !== 'RUNNING' || !job.reservedAt) {
        continue;
      }

      const reservedAt = job.reservedAt.getTime();
      if (now - reservedAt < interval) {
        continue;
      }

      job.stalledCount += 1;

      if (job.stalledCount > this.options.maxStalledCount) {
        job.status = 'FAILED';
        job.finishedAt = new Date();
        job.error = 'Job stalled too often';
        job.reservedAt = null;
        this.pruneFinished();
        continue;
      }

      // requeue as DELAYED (with retry delay) unless attempts exhausted
      if (job.attempts >= this.options.maxAttempts) {
        job.status = 'FAILED';
        job.finishedAt = new Date();
        job.error = 'Job stalled and max attempts reached';
        job.reservedAt = null;
        this.pruneFinished();
        continue;
      }

      const delay = this.computeRetryDelayMs(job.attempts + 1);
      job.status = 'DELAYED';
      job.runAt = new Date(Date.now() + delay);
      job.reservedAt = null;
      job.error = 'Job stalled; requeued';
    }
  }

  private canRunAnotherJob(now: number): boolean {
    const limit = this.options.limit;
    if (!limit) {
      return true;
    }

    const elapsed = now - this.windowStartedAt;

    if (elapsed >= limit.duration) {
      this.windowStartedAt = now;
      this.windowCount = 0;
      return true;
    }

    return this.windowCount < limit.max;
  }

  private computeRetryDelayMs(attempt: number): number {
    const base = Math.max(0, this.options.retryDelay);

    if (this.options.retryDelayType === 'fixed') {
      return base;
    }

    // exponential backoff: base * 2^(attempt-1), attempt is 1-based in our usage
    const pow = Math.max(0, attempt - 1);
    const delay = base * Math.pow(2, pow);

    // keep it sane
    return Math.min(delay, 60 * 60 * 1000);
  }

  private normalizePriority(priority?: number): number {
    if (priority == null || !Number.isFinite(priority)) {
      return 100;
    }

    // 1 is highest; avoid 0/negative
    return Math.max(1, Math.floor(priority));
  }

  private stringifyError(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }

  /**
   * Prevent unbounded memory growth:
   * - keep all unfinished jobs (PENDING/DELAYED/RUNNING)
   * - keep only last `finishedRetention` finished jobs (COMPLETED/FAILED)
   */
  private pruneFinished(): void {
    if (this.finishedRetention <= 0) {
      // drop all finished, keep unfinished only
      for (const [id, j] of this.jobs.entries()) {
        if (j.status === 'COMPLETED' || j.status === 'FAILED') {
          this.jobs.delete(id);
        }
      }
      return;
    }

    const unfinishedIds: string[] = [];
    const finished: { id: string; finishedAt: number }[] = [];

    for (const [id, j] of this.jobs.entries()) {
      if (
        j.status === 'PENDING' ||
        j.status === 'DELAYED' ||
        j.status === 'RUNNING'
      ) {
        unfinishedIds.push(id);
      } else {
        finished.push({ id, finishedAt: j.finishedAt?.getTime() ?? 0 });
      }
    }

    if (finished.length <= this.finishedRetention) {
      return;
    }

    // keep newest finished first
    finished.sort((a, b) => b.finishedAt - a.finishedAt);

    const keep = new Set<string>(unfinishedIds);
    for (const f of finished.slice(0, this.finishedRetention)) {
      keep.add(f.id);
    }

    for (const id of this.jobs.keys()) {
      if (!keep.has(id)) {
        this.jobs.delete(id);
      }
    }
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new Error('MemoryQueue is closed');
    }
  }
}
