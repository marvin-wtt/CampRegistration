import type { Queue, QueueOptions } from '#core/queue/Queue';
import { RedisQueue } from '#core/queue/RedisQueue';
import { DatabaseQueue } from '#core/queue/DatabaseQueue';

export class QueueManager {
  static createQueue<T extends object>(
    queue: string,
    options?: Partial<QueueOptions>,
  ): Queue<T> {
    if (RedisQueue.isAvailable()) {
      return new RedisQueue<T>(queue, options);
    }

    return new DatabaseQueue<T>(queue, options);
  }
}
