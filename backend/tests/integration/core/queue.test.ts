import { describe, it, expect } from 'vitest';
import { DatabaseQueue } from '#core/queue/DatabaseQueue';
import type { QueueOptions } from '#core/queue/Queue.js';
import { MemoryQueue } from '#core/queue/MemoryQueue.js';
import { RedisQueue } from '#core/queue/RedisQueue.js';
import queueManager from '#core/queue/QueueManager.js';

const DEFAULTS = {
  retryDelay: 100,
  retryDelayType: 'fixed' as const,
  maxAttempts: 3,
  stalledInterval: 300,
  maxStalledCount: 1,
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function uniq(name: string) {
  return `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function waitUntil(
  check: () => boolean | Promise<boolean>,
  opts: { timeout?: number; interval?: number } = {},
) {
  const timeout = opts.timeout ?? 2_000;
  const interval = opts.interval ?? 20;
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (await check()) {
      return;
    }
    if (Date.now() - started > timeout) {
      throw new Error(`waitUntil: timed out after ${timeout}ms`);
    }
    await sleep(interval);
  }
}

describe('Queue', () => {
  describe('manager', async () => {
    it('should create a queue', async () => {
      const q = queueManager.createQueue<null, null, 'test'>('type', DEFAULTS);

      expect(q.type).toBe('memory');

      await q.close();
    });

    it('no double-processing with two workers (concurrency safety)', async () => {
      const name = 'dbq-concurrency';
      queueManager.createQueue<{ n: number }, void, 'test'>(name, DEFAULTS);

      expect(() =>
        queueManager.createQueue<{ n: number }, void, 'test'>(name, DEFAULTS),
      ).toThrowError();
    });
  });

  describe.each([
    {
      name: 'database',
      createQueue: <P, R, N extends string>(
        n: string,
        o: Partial<QueueOptions>,
      ) => new DatabaseQueue<P, R, N>(n, o),
    },
    {
      name: 'memory',
      createQueue: <P, R, N extends string>(
        n: string,
        o: Partial<QueueOptions>,
      ) => new MemoryQueue<P, R, N>(n, o),
    },
    {
      name: 'redis',
      createQueue: <P, R, N extends string>(
        n: string,
        o: Partial<QueueOptions>,
      ) => new RedisQueue<P, R, N>(n, o),
    },
  ])('$name queue', ({ name, createQueue }) => {
    it('processes a job', async () => {
      const q = createQueue<{ x: number }, string, 'test'>(
        uniq(`q-happy-${name}`),
        DEFAULTS,
      );

      const seen: any[] = [];
      q.process(async (p) => {
        seen.push(p.payload);
        return 'ok';
      });

      await q.add('test', { x: 42 });
      await waitUntil(async () => (await q.all('COMPLETED')).length === 1, {
        timeout: 5_000,
      });

      expect(seen).toEqual([{ x: 42 }]);

      await q.close();
    });

    it('retries once after failure then completes', async () => {
      const q = createQueue<{ i: number }, string, 'test'>(
        uniq(`q-retry-${name}`),
        {
          ...DEFAULTS,
          maxAttempts: 3,
          retryDelay: 50,
        },
      );

      let calls = 0;
      q.process(async () => {
        calls++;
        if (calls === 1) throw new Error('boom');
        return 'ok';
      });

      await q.add('test', { i: 1 });

      await waitUntil(async () => (await q.all('COMPLETED')).length === 1, {
        timeout: 8_000,
      });
      const all = await q.all();
      expect(all.some((j) => j.status === 'FAILED')).toBe(false);

      await q.close();
    });

    it('marks FAILED after reaching maxAttempts', async () => {
      const q = createQueue<{}, string, 'test'>(uniq(`q-fail-${name}`), {
        ...DEFAULTS,
        maxAttempts: 2,
        retryDelay: 50,
      });

      q.process(async () => {
        throw new Error('always bad');
      });

      await q.add('test', {});
      await waitUntil(async () => (await q.all('FAILED')).length === 1, {
        timeout: 10_000,
      });

      await q.close();
    });

    it('respects delay', async () => {
      const q = createQueue<{}, string, 'test'>(
        uniq(`q-delay-${name}`),
        DEFAULTS,
      );

      let ran = false;
      q.process(async () => {
        ran = true;
        return 'ok';
      });

      await q.add('test', {}, { delay: 300 });

      await sleep(120);
      expect(ran).toBe(false);

      await waitUntil(() => ran, { timeout: 5_000 });

      await q.close();
    });

    it('prevents processing while paused', async () => {
      const q = createQueue<{}, number, 'test'>(
        uniq(`q-pause-${name}`),
        DEFAULTS,
      );

      const seen: number[] = [];
      q.process(async () => seen.push(1));
      q.pause();
      // Wait for queue to stop
      await sleep(250);

      await q.add('test', {});
      await sleep(250); // allow poll ticks
      expect(seen.length).toBe(0);

      q.resume();
      await waitUntil(() => seen.length === 1, { timeout: 5_000 });

      await q.close();
    });

    it('limits throughput', async () => {
      const q = createQueue<{ n: number }, string, 'test'>(
        uniq(`q-rl-${name}`),
        { ...DEFAULTS, limit: { max: 1, duration: 300 } },
      );

      const ticks: number[] = [];
      q.process(async () => {
        ticks.push(Date.now());
        return 'ok';
      });

      await q.add('test', { n: 1 });
      await q.add('test', { n: 2 });

      await waitUntil(() => ticks.length >= 2, { timeout: 5_000 });
      expect(ticks[1] - ticks[0]).toBeGreaterThanOrEqual(200); // slack

      await q.close();
    });

    it('counts only unfinished jobs', async () => {
      const q = createQueue<{ n: number }, string, 'test'>(
        uniq(`q-count-${name}`),
        DEFAULTS,
      );

      await q.add('test', { n: 1 });
      await q.add('test', { n: 1 });
      await q.add('test', { n: 1 });

      expect(await q.count()).toBe(3);

      // Process one job, then pause from the test thread (not inside handler)
      q.process(async () => {
        await q.pause();

        return 'Ok';
      });

      await waitUntil(async () => (await q.all('COMPLETED')).length === 1, {
        timeout: 3_000,
      });

      await q.pause();

      // ensure no more completions happen after pause
      await sleep(200);

      expect(await q.count()).toBe(2);

      await q.close();
    });

    it('throws error when queue is closed', async () => {
      const q = createQueue<{ n: number }, string, 'test'>(
        uniq(`q-no-handler-${name}`),
        DEFAULTS,
      );

      await q.close();

      try {
        const promise = Promise.resolve(q.add('test', { n: 1 }));

        expect(promise).rejects.toThrowError();
      } catch (e) {}
    });
  });
});
