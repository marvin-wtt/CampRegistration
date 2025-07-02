import type { Queue, QueueOptions } from '#core/queue/Queue';
import { RedisQueue } from '#core/queue/RedisQueue';
import { DatabaseQueue } from '#core/queue/DatabaseQueue';

export class QueueManager {
  static queues: Record<string, Queue<object>> = {};

  static all(): Queue<object>[] {
    return Object.values(this.queues);
  }

  static createQueue<T extends object>(
    name: string,
    options?: Partial<QueueOptions>,
  ): Queue<T> {
    if (name in this.queues) {
      throw new Error(`Queue ${name} already exists.`);
    }

    const queue = this.create<T>(name, options);
    this.queues[name] = queue;

    return queue;
  }

  private static create<T extends object>(
    queue: string,
    options?: Partial<QueueOptions>,
  ): Queue<T> {
    if (RedisQueue.isAvailable()) {
      return new RedisQueue<T>(queue, options);
    }

    return new DatabaseQueue<T>(queue, options);
  }
}
