import {
  Queue,
  type QueueOptions,
  type JobOptions,
  type JobStatus,
} from '#core/queue/Queue';
import {
  Queue as BullQueue,
  type Job as BullJob,
  QueueEvents,
  Worker,
  type ConnectionOptions,
} from 'bullmq';
import logger from '#core/logger';
import config from '#config/index';

export class RedisQueue<P, R, N extends string> extends Queue<P, R, N> {
  public readonly type = 'redis';

  private bull: BullQueue<BullJob<P, R, N>>;
  private worker: Worker<P, R, N> | undefined;
  private events: QueueEvents;
  private connection: ConnectionOptions;

  static isAvailable(): boolean {
    return config.redis.host !== undefined;
  }

  constructor(queue: string, options?: Partial<QueueOptions>) {
    super(queue, options);

    this.connection = {
      host: config.redis.host,
      password: config.redis.password,
      username: config.redis.username,
      db: config.redis.db,
      port: config.redis.port,
    };

    this.bull = new BullQueue(queue, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: this.options.maxAttempts,
        backoff: {
          type: this.options.retryDelayType,
          delay: this.options.retryDelay,
        },
      },
    });

    this.bull.on('error', (error) => {
      logger.error(`Error in queue ${queue}:`, error);
    });

    this.events = new QueueEvents(this.queue, {
      connection: this.connection,
    });

    this.events.on('failed', (job) => {
      logger.error(
        `Error while processing job ${job.jobId} in queue ${queue}:`,
        job.failedReason,
      );
    });

    this.events.on('stalled', (job) => {
      logger.warn(`Job ${job.jobId} in queue ${queue} has stalled.`);
    });

    this.events.on('error', (err) => {
      logger.error(`QueueEvents error ${queue}`, err);
    });
  }

  public async all(status?: JobStatus) {
    const activeJobs = await this.bull.getJobs([
      'active',
      'prioritized',
      'repeat',
    ]);
    const completedJobs = await this.bull.getJobs(['completed']);
    const failedJobs = await this.bull.getJobs(['failed']);
    const delayedJobs = await this.bull.getJobs(['delayed']);
    const pendingJobs = await this.bull.getJobs([
      'paused',
      'wait',
      'waiting',
      'waiting-children',
    ]);

    const mapJob = (status: JobStatus) => (job: BullJob<P>) => ({
      id: job.id?.toString() ?? '?',
      name: job.name,
      queue: this.queue,
      status,
      error: job.failedReason,
      attempts: job.attemptsMade,
      payload: job.data,
      reservedAt: job.processedOn ? new Date(job.processedOn) : null,
      runAt: null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    });

    return [
      ...activeJobs.map(mapJob('RUNNING')),
      ...completedJobs.map(mapJob('COMPLETED')),
      ...failedJobs.map(mapJob('FAILED')),
      ...pendingJobs.map(mapJob('PENDING')),
      ...delayedJobs.map(mapJob('DELAYED')),
    ]
      .filter((job) => status === undefined || job.status === status)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  public async add(name: N, payload: P, options?: JobOptions): Promise<void> {
    await this.bull.add(name, payload, {
      priority: options?.priority,
      delay: options?.delay,
    });
  }

  public process(handler: (payload: P) => Promise<R>): void {
    if (this.worker) {
      throw new Error(`Worker for queue ${this.queue} already exists.`);
    }

    this.worker = new Worker<P, R, N>(
      this.queue,
      (job) => {
        return handler(job.data);
      },
      {
        connection: this.connection,
        stalledInterval: this.options.stalledInterval,
        maxStalledCount: this.options.maxStalledCount,
      },
    );
  }

  public async count(): Promise<number> {
    return this.bull.count();
  }

  public async close(): Promise<void> {
    await this.worker?.close();
    await this.events.close();
    await this.bull.close();
  }

  public async pause(): Promise<void> {
    await this.bull.pause();
  }

  public async resume(): Promise<void> {
    await this.bull.resume();
  }
}
