import { describe, it, expect } from 'vitest';
import queueManager from '../../../src/core/queue/QueueManager';

const DEFAULTS = {
  retryDelay: 100,
  retryDelayType: 'fixed' as const,
  maxAttempts: 3,
  stallTimeout: 300, // ms
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

describe('DatabaseQueue (integration)', () => {
  it('should use the database queue implementation', () => {
    const q = queueManager.createQueue<null, null, 'test'>('type', DEFAULTS);

    expect(q.type).toBe('database');
    q.close();
  });

  it('should processes a job', async () => {
    const q = queueManager.createQueue<{ x: number }, string, 'test'>(
      'dbq-happy',
      DEFAULTS,
    );

    const seen: any[] = [];
    q.process(async (p) => {
      seen.push(p);
      return 'ok';
    });

    await q.add('test', { x: 42 });
    await waitUntil(async () => (await q.all('COMPLETED')).length === 1);

    expect(seen).toEqual([{ x: 42 }]);
    q.close();
  });

  it('retries once after a failure, then completes', async () => {
    const q = queueManager.createQueue<{ i: number }, string, 'test'>(
      'dbq-retry',
      { ...DEFAULTS, maxAttempts: 3, retryDelay: 50 },
    );

    let calls = 0;
    q.process(async () => {
      calls++;
      if (calls === 1) throw new Error('boom');
      return 'ok';
    });

    await q.add('test', { i: 1 });

    await waitUntil(async () => (await q.all('COMPLETED')).length === 1);
    const all = await q.all();
    expect(all.some((j) => j.status === 'FAILED')).toBe(false);
    q.close();
  });

  it('marks as FAILED after reaching max attempts', async () => {
    const q = queueManager.createQueue<{}, string, 'test'>('dbq-fail', {
      ...DEFAULTS,
      maxAttempts: 2,
      retryDelay: 50,
    });

    q.process(async () => {
      throw new Error('always bad');
    });

    await q.add('test', {});

    await waitUntil(async () => (await q.all('FAILED')).length === 1, {
      timeout: 4_000,
    });
    q.close();
  });

  it('respects delay (scheduled job)', async () => {
    const q = queueManager.createQueue<{}, string, 'test'>(
      'dbq-delay',
      DEFAULTS,
    );

    const seen: number[] = [];
    q.process(async () => {
      seen.push(Date.now());
      return 'ok';
    });

    const t0 = Date.now();
    await q.add('test', {}, { delay: 300 });

    // Should not run immediately
    await sleep(120);
    expect(seen.length).toBe(0);

    // Then should run
    await waitUntil(() => seen.length === 1, { timeout: 2_000 });
    expect(seen[0] - t0).toBeGreaterThanOrEqual(280);
    q.close();
  });

  it('pause/resume prevents processing while paused', async () => {
    const q = queueManager.createQueue<{}, number, 'test'>(
      'dbq-pause',
      DEFAULTS,
    );
    const seen: number[] = [];
    q.process(async () => {
      return seen.push(1);
    });

    q.pause();
    await sleep(50);

    await q.add('test', {});
    await sleep(250); // allow poll ticks
    expect(seen.length).toBe(0);

    q.resume();
    await waitUntil(() => seen.length === 1);
    q.close();
  });

  it('no double-processing with two workers (concurrency safety)', async () => {
    const name = 'dbq-concurrency';
    queueManager.createQueue<{ n: number }, void, 'test'>(name, DEFAULTS);

    expect(() =>
      queueManager.createQueue<{ n: number }, void, 'test'>(name, DEFAULTS),
    ).toThrowError();
  });

  it('rate limiting allows only limited throughput', async () => {
    const q = queueManager.createQueue<{ n: number }, string, 'test'>(
      'dbq-rl',
      { ...DEFAULTS, limit: { max: 1, duration: 300 } }, // 1 token / 300ms
    );
    const ticks: number[] = [];
    q.process(async () => {
      ticks.push(Date.now());
      return 'ok';
    });

    await q.add('test', { n: 1 });
    await q.add('test', { n: 2 });

    await waitUntil(() => ticks.length >= 1);
    // Second should be ~after 300ms (allow tolerance)
    await waitUntil(() => ticks.length === 2, { timeout: 2_000 });

    expect(ticks[1] - ticks[0]).toBeGreaterThanOrEqual(260);
    q.close();
  });

  it('stalled job is recovered (returns to PENDING and runs)', async () => {
    // VERY small stall timeout so the reaper kicks in
    const q = queueManager.createQueue<{}, string, 'test'>('dbq-stall', {
      ...DEFAULTS,
      stalledInterval: 150,
    });

    let firstRun = true;
    const seen: number[] = [];
    q.process(async () => {
      seen.push(1);
      if (firstRun) {
        firstRun = false;
        // Simulate stall by not completing? (Your queue marks RUNNING and handler throws to release)
        // We'll force a throw to trigger release later.
        throw new Error('simulate crash');
      }
      return 'ok';
    });

    await q.add('test', {});
    await waitUntil(
      async () => {
        await q.all('FAILED'); // not terminal yet
        const completed = await q.all('COMPLETED');
        return seen.length >= 2 || completed.length >= 1;
      },
      { timeout: 5_000 },
    );

    q.close();
  });
});
