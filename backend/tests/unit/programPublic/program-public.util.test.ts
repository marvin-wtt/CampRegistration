import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeDefaultPublicDate } from '#app/programPublic/program-public.util';

describe('computeDefaultPublicDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T23:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to today when the event is currently running', () => {
    const event = {
      startAt: '2026-06-01T09:00:00',
      endAt: '2026-07-31T18:00:00',
      timezone: 'UTC',
    };

    expect(computeDefaultPublicDate(event)).toBe('2026-07-01');
  });

  it('defaults to the first day when the event has not started yet', () => {
    const event = {
      startAt: '2027-01-01T09:00:00',
      endAt: '2027-01-10T18:00:00',
      timezone: 'UTC',
    };

    expect(computeDefaultPublicDate(event)).toBe('2027-01-01');
  });

  it('defaults to the first day, not the last, once the event is over', () => {
    const event = {
      startAt: '2020-01-01T09:00:00',
      endAt: '2020-01-10T18:00:00',
      timezone: 'UTC',
    };

    expect(computeDefaultPublicDate(event)).toBe('2020-01-01');
  });
});
