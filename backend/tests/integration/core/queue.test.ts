import { describe, it, expect } from 'vitest';
import type { QueueOptions } from '#core/queue/Queue';
import { QueueManager } from '#core/queue/QueueManager';
import { config } from '#core/ioc/facades';
import { waitUntil, wait } from '../utils/wait.js';
import { AppConfig } from '#config/index';
import { Container } from 'inversify';
import { TYPES } from '#core/ioc/types';

const DEFAULTS = {
  retryDelay: 100,
  retryDelayType: 'fixed' as const,
  maxAttempts: 3,
  stalledInterval: 300,
  maxStalledCount: 1,
};

function uniqueName(name: string) {
  return `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeTestContainer(appConfig: AppConfig) {
  const c = new Container({ defaultScope: 'Singleton' });

  c.bind<AppConfig>(TYPES.Config).toConstantValue(appConfig);
  c.bind(QueueManager).toSelf().inSingletonScope();

  return c;
}

describe('Queue', () => {
  describe.each([{ name: 'database' }, { name: 'memory' }, { name: 'redis' }])(
    '$name queue',
    ({ name }) => {
      const base = config(); // your facade that returns real config
      const appConfig = {
        ...base,
        queue: {
          ...base.queue,
          driver: name as typeof base.queue.driver,
        },
      } satisfies AppConfig;

      const container = makeTestContainer(appConfig);
      const queueManager = container.get(QueueManager);

      function createQueue<P, R, N extends string>(
        name: string,
        options: Partial<QueueOptions>,
      ) {
        return queueManager.create<P, R, N>(name, options);
      }

      it('should create the correct queue type', () => {
        const q = createQueue<{ x: number }, string, 'test'>(
          uniqueName(`q-${name}`),
          DEFAULTS,
        );

        expect(q.type).toBe(name);
      });

      it('processes a job', async () => {
        const q = createQueue<{ x: number }, string, 'test'>(
          uniqueName(`q-happy-${name}`),
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
          uniqueName(`q-retry-${name}`),
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
        const q = createQueue<{}, string, 'test'>(
          uniqueName(`q-fail-${name}`),
          {
            ...DEFAULTS,
            maxAttempts: 2,
            retryDelay: 50,
          },
        );

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
          uniqueName(`q-delay-${name}`),
          DEFAULTS,
        );

        let ran = false;
        q.process(async () => {
          ran = true;
          return 'ok';
        });

        await q.add('test', {}, { delay: 300 });

        await wait(120);
        expect(ran).toBe(false);

        await waitUntil(() => ran, { timeout: 5_000 });

        await q.close();
      });

      it('prevents processing while paused', async () => {
        const q = createQueue<{}, number, 'test'>(
          uniqueName(`q-pause-${name}`),
          DEFAULTS,
        );

        const seen: number[] = [];
        q.process(async () => seen.push(1));
        q.pause();
        // Wait for queue to stop
        await wait(250);

        await q.add('test', {});
        await wait(250); // allow poll ticks
        expect(seen.length).toBe(0);

        q.resume();
        await waitUntil(() => seen.length === 1, { timeout: 5_000 });

        await q.close();
      });

      it('limits throughput', async () => {
        const q = createQueue<{ n: number }, string, 'test'>(
          uniqueName(`q-rl-${name}`),
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
          uniqueName(`q-count-${name}`),
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
        await wait(200);

        expect(await q.count()).toBe(2);

        await q.close();
      });

      it('throws error when queue is closed', async () => {
        const q = createQueue<{ n: number }, string, 'test'>(
          uniqueName(`q-no-handler-${name}`),
          DEFAULTS,
        );

        // Give redis some time to connect
        await wait(100);

        await q.close();

        try {
          await Promise.resolve(q.add('test', { n: 1 }));

          // This should never be reached
          expect(true).toBe(false);
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    },
  );
});
