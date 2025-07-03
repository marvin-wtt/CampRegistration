import type { Queue, QueueOptions } from '#core/queue/Queue';
import { RedisQueue } from '#core/queue/RedisQueue';
import { DatabaseQueue } from '#core/queue/DatabaseQueue';

export class QueueManager {
  private queues: Record<string, Queue<unknown, unknown>> = {};

  all(): Queue<unknown, unknown>[] {
    return Object.values(this.queues);
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.all().map((queue) => queue.close()));
  }

  createQueue<P, R = void, N extends string = string>(
    name: string,
    options?: Partial<QueueOptions>,
  ): Queue<P, R, N> {
    if (name in this.queues) {
      throw new Error(`Queue ${name} already exists.`);
    }

    const queue = this.create<P, R, N>(name, options);
    this.queues[name] = queue;

    return queue;
  }

  private create<P, R, N extends string>(
    queue: string,
    options?: Partial<QueueOptions>,
  ): Queue<P, R, N> {
    if (RedisQueue.isAvailable()) {
      return new RedisQueue<P, R, N>(queue, options);
    }

    return new DatabaseQueue<P, R, N>(queue, options);
  }
}

export default new QueueManager();
