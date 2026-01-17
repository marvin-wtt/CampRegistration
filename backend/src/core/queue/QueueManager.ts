import type { Queue, QueueOptions } from '#core/queue/Queue';
import { RedisQueue } from '#core/queue/RedisQueue';
import { DatabaseQueue } from '#core/queue/DatabaseQueue';
import { MemoryQueue } from '#core/queue/MemoryQueue';
import type { AppConfig } from '#config/index';
import logger from '#core/logger';
import { injectable } from 'inversify';
import { Config } from '#core/ioc/decorators';

@injectable()
export class QueueManager {
  protected queues: Record<string, Queue<unknown, unknown>> = {};

  public constructor(@Config() private readonly config: AppConfig) {}

  all(): Queue<unknown, unknown>[] {
    return Object.values(this.queues);
  }

  async close(): Promise<void> {
    const results = await Promise.allSettled(
      this.all().map((queue) => Promise.resolve(queue.close())),
    );

    results
      .filter((result) => result.status === 'rejected')
      .forEach((result) => {
        logger.error('Failed to close queue', result.reason);
      });
  }

  create<P, R = void, N extends string = string>(
    name: string,
    options?: Partial<QueueOptions>,
  ): Queue<P, R, N> {
    logger.info(`Creating queue ${name}`);

    if (name in this.queues) {
      throw new Error(`Queue ${name} already exists.`);
    }

    const queue = this.createImpl<P, R, N>(name, options);
    this.queues[name] = queue;

    return queue;
  }

  private createImpl<P, R, N extends string>(
    queue: string,
    options?: Partial<QueueOptions>,
  ): Queue<P, R, N> {
    if (this.config.queue.driver === 'redis') {
      return new RedisQueue<P, R, N>(queue, options);
    }
    if (this.config.queue.driver === 'database') {
      return new DatabaseQueue<P, R, N>(queue, options);
    }

    return new MemoryQueue<P, R, N>(queue, options);
  }
}
