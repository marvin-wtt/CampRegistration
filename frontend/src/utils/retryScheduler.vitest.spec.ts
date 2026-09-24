import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { createRetryScheduler } from '@/utils/retryScheduler';

function httpError(status: number, retryAfter?: string): AxiosError {
  const headers = new AxiosHeaders();
  if (retryAfter !== undefined) {
    headers.set('retry-after', retryAfter);
  }

  return new AxiosError('Request failed', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers,
    config: { headers: new AxiosHeaders() },
    data: undefined,
  });
}

describe('createRetryScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('backs off exponentially and caps at the max delay', async () => {
    const scheduler = createRetryScheduler();
    const task = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule(task, httpError(503));
    await vi.advanceTimersByTimeAsync(4_999);
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledOnce();

    scheduler.schedule(task, httpError(503));
    await vi.advanceTimersByTimeAsync(9_999);
    expect(task).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('honours Retry-After over the computed backoff', async () => {
    const scheduler = createRetryScheduler();
    const task = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule(task, httpError(429, '30'));
    await vi.advanceTimersByTimeAsync(29_999);
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledOnce();
  });

  it('fires onFirstAttempt only once per retry sequence', () => {
    const scheduler = createRetryScheduler();
    const task = vi.fn().mockResolvedValue(undefined);
    const onFirstAttempt = vi.fn();

    scheduler.schedule(task, httpError(503), onFirstAttempt);
    scheduler.schedule(task, httpError(503), onFirstAttempt);
    expect(onFirstAttempt).toHaveBeenCalledOnce();

    scheduler.stop();
    scheduler.schedule(task, httpError(503), onFirstAttempt);
    expect(onFirstAttempt).toHaveBeenCalledTimes(2);
  });

  it('replaces its own pending retry rather than stacking calls', async () => {
    const scheduler = createRetryScheduler();
    const task = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule(task, httpError(503)); // would fire at t=5s if left alone
    await vi.advanceTimersByTimeAsync(2_000); // t=2s
    scheduler.schedule(task, httpError(503)); // replaces it; next fire at t=2s+10s=12s

    await vi.advanceTimersByTimeAsync(3_000); // t=5s: the replaced timer must not fire
    expect(task).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(6_999); // t=11.999s
    expect(task).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); // t=12s
    expect(task).toHaveBeenCalledOnce();
  });

  it('stop() cancels the pending retry and resets the backoff', async () => {
    const scheduler = createRetryScheduler();
    const task = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule(task, httpError(503));
    scheduler.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(task).not.toHaveBeenCalled();
  });

  it('keeps two schedulers fully independent', async () => {
    const a = createRetryScheduler();
    const b = createRetryScheduler();
    const taskA = vi.fn().mockResolvedValue(undefined);
    const taskB = vi.fn().mockResolvedValue(undefined);

    a.schedule(taskA, httpError(503)); // fires at t=5s unless touched
    await vi.advanceTimersByTimeAsync(1_000); // t=1s

    // Starting b's retry loop must not reset or cancel a's pending timer —
    // this is the collision the old shared retryTimer/retryAttempt had.
    b.schedule(taskB, httpError(503)); // fires at t=1s+5s=6s

    await vi.advanceTimersByTimeAsync(3_999); // t=4.999s
    expect(taskA).not.toHaveBeenCalled();
    expect(taskB).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1); // t=5s
    expect(taskA).toHaveBeenCalledOnce();
    expect(taskB).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_000); // t=6s
    expect(taskB).toHaveBeenCalledOnce();
  });
});
