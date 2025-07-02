import {
  Queue,
  type QueueOptions,
  type JobOptions,
  type JobStatus,
} from '#core/queue/Queue';
import { default as BullQueue, type Queue as IBullQueue } from 'bull';
import logger from '#core/logger';
import config from '#config/index';

export class RedisQueue<T extends object> extends Queue<T> {
  private bull: IBullQueue<T>;

  static isAvailable(): boolean {
    return config.redis.host !== undefined;
  }

  constructor(queue: string, options?: Partial<QueueOptions>) {
    super(queue, options);

    this.bull = new BullQueue(queue, {
      redis: {
        host: config.redis.host,
        password: config.redis.password,
        username: config.redis.username,
        db: config.redis.db,
        port: config.redis.port,
      },
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

    this.bull.on('failed', (job, error) => {
      logger.error(
        `Error while processing job ${job.id.toString()} in queue ${queue} (attempt ${job.attemptsMade.toString()}):`,
        error,
      );
    });

    this.bull.on('stalled', (job) => {
      logger.warn(`Job ${job.id.toString()} in queue ${queue} has stalled.`);
    });
  }

  public async all(status?: JobStatus) {
    const activeJobs = await this.bull.getJobs(['active']);
    const completedJobs = await this.bull.getJobs(['completed']);
    const failedJobs = await this.bull.getJobs(['failed']);
    const delayedJobs = await this.bull.getJobs(['delayed']);
    const pendingJobs = await this.bull.getJobs(['paused', 'waiting']);

    const mapJob = (status: JobStatus) => (job: BullQueue.Job<T>) => ({
      id: job.id.toString(),
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
      ...activeJobs.map(mapJob('PENDING')),
      ...completedJobs.map(mapJob('COMPLETED')),
      ...failedJobs.map(mapJob('FAILED')),
      ...pendingJobs.map(mapJob('PENDING')),
      ...delayedJobs.map(mapJob('DELAYED')),
    ]
      .filter((job) => status === undefined || job.status === status)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  public async add(payload: T, options: JobOptions): Promise<void> {
    await this.bull.add(payload, {
      priority: options.priority,
      delay: options.delay,
    });
  }

  public async process(handler: (payload: T) => Promise<void>): Promise<void> {
    await this.bull.process(async (job) => {
      await handler(job.data);

      return null;
    });
  }

  public async close(): Promise<void> {
    await this.bull.close();
  }

  public async pause(): Promise<void> {
    await this.bull.pause();
  }

  public async resume(): Promise<void> {
    await this.bull.resume();
  }
}
