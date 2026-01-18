import {
  type JobOptions,
  type Job,
  type JobStatus,
  Queue,
  type SimpleJob,
  type QueueOptions,
} from '#core/queue/Queue.js';
import { container } from '#core/ioc/container';
import { QueueManager } from '#core/queue/QueueManager';

export function mockQueue() {
  container.rebindSync(QueueManager).to(TestQueueManager);
}

class TestQueueManager extends QueueManager {
  create<P, R = void, N extends string = string>(
    name: string,
    options?: Partial<QueueOptions>,
  ): Queue<P, R, N> {
    if (name in this.queues) {
      throw new Error(`Queue ${name} already exists.`);
    }

    const queue = new TestQueue<P, R, N>(name, options);
    this.queues[name] = queue;

    return queue;
  }
}

class TestQueue<P, R, N extends string> extends Queue<P, R, N> {
  public readonly type = 'test';

  private handler: ((payload: SimpleJob<P>) => Promise<R>) | null = null;
  private closed = false;

  process(handler: (job: SimpleJob<P>) => Promise<R>) {
    if (this.handler !== null) {
      throw new Error('Queue already processed');
    }
    this.handler = handler;
  }

  async add(name: N, payload: P, options?: JobOptions): Promise<void> {
    if (this.closed) {
      throw new Error('Queue closed');
    }
    if (this.handler === null) {
      throw new Error('Queue not processed');
    }

    if (options?.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    await this.handler({ name, payload });
  }

  pause(): Promise<void> {
    return Promise.resolve();
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }

  count(): Promise<number> {
    return Promise.resolve(0);
  }

  all(_status?: JobStatus): Promise<Job<P>[]> {
    return Promise.resolve([]);
  }
}
