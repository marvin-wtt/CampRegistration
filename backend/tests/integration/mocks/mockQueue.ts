import {
  type JobOptions,
  type Job,
  type JobStatus,
  Queue,
  type SimpleJob,
  type QueueOptions,
} from '#core/queue/Queue.js';
import { vi } from 'vitest';

export function mockQueue() {
  const queues = new Map<string, TestQueue<any, any, any>>();

  vi.mock('../../src/queue/QueueManager.js', () => ({
    all: () => Object.values(queues),
    createQueue: (name: string, options?: Partial<QueueOptions>) => {
      const q = new TestQueue<any, any, any>(name, options);
      queues.set(name, q);
      return q;
    },
  }));

  // // Intercept QueueManager's driver selection (Redis/DB) and return our TestQueue instead.
  // const createQueueSpy = vi
  //   .spyOn(queueManager, 'createQueue')
  //   .mockImplementation((name: string, options?: Partial<QueueOptions>) => {
  //     const q = new TestQueue<any, any, any>(name, options);
  //     queues.set(name, q);
  //     return q;
  //   });
  //
  // const allQueueSpy = vi
  //   .spyOn(queueManager, 'all')
  //   .mockImplementation(() => Object.values(queues));
  //
  // return () => {
  //   createQueueSpy.mockRestore();
  //   allQueueSpy.mockRestore();
  // };
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
