import {
  Queue,
  type QueueOptions,
  type EnnQueueOptions,
} from '#core/queue/Queue.js';
import { default as BullQueue, type Queue as IBullQueue } from 'bull';

export class RedisQueue<T extends object> extends Queue<T> {
  private bull: IBullQueue<T>;

  constructor(queue: string, options?: Partial<QueueOptions>) {
    super(queue, options);

    this.bull = new BullQueue(queue, {
      redis: {
        // TODO Add Redis connection options
      },
      defaultJobOptions: {
        attempts: this.options.maxAttempts,
        backoff: {
          type: this.options.retryDelayType,
          delay: this.options.retryDelay,
        },
      },
    });
  }

  public async all() {
    const jobs = await this.bull.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
    ]);

    // TODO Map to common type
    return jobs.map((job) => ({
      id: job.id,
      status: job.getState(), // TODO Map status
      payload: job.data,
      attempts: job.attemptsMade,
      error: job.failedReason,
    }));
  }

  public async add(payload: T, options: EnnQueueOptions): Promise<void> {
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
}
