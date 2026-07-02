import { afterEach, describe, expect, it, vi } from 'vitest';
import { JobScheduler } from '#core/scheduler/JobScheduler';

describe('JobScheduler', () => {
  let scheduler: JobScheduler;

  afterEach(() => {
    scheduler.stop();
  });

  it('registers a named job', () => {
    scheduler = new JobScheduler();

    scheduler.schedule('daily', '0 0 * * *', () => undefined);

    const job = scheduler.findJob('daily');
    expect(job).toBeDefined();
    expect(job?.name).toBe('daily');
  });

  it('ignores duplicate registrations of the same name', () => {
    scheduler = new JobScheduler();
    const fn = vi.fn();

    scheduler.schedule('daily', '0 0 * * *', fn);
    const first = scheduler.findJob('daily');

    // A second registration with a different pattern must be a no-op.
    scheduler.schedule('daily', '30 1 * * *', vi.fn());
    const second = scheduler.findJob('daily');

    expect(second).toBe(first);
  });

  it('stop() clears all scheduled jobs', () => {
    scheduler = new JobScheduler();

    scheduler.schedule('a', '0 0 * * *', () => undefined);
    scheduler.schedule('b', '0 1 * * *', () => undefined);

    scheduler.stop();

    expect(scheduler.findJob('a')).toBeUndefined();
    expect(scheduler.findJob('b')).toBeUndefined();
  });
});
