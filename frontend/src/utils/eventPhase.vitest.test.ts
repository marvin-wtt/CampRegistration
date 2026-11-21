import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Event } from '@camp-registration/common/entities';
import { isEventArchived, phaseOf } from '@/utils/eventPhase';

function event(overrides: Partial<Event> = {}): Event {
  return {
    startAt: '2026-08-10T00:00:00',
    endAt: '2026-08-15T23:59:59',
    timezone: 'UTC',
    archivedAt: null,
    ...overrides,
  } as Event;
}

describe('phaseOf', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([
    ['2026-08-09T23:59:59Z', 'upcoming'],
    ['2026-08-12T12:00:00Z', 'ongoing'],
    ['2026-08-16T00:00:00Z', 'ended'],
    // No longer moves anywhere on its own, however long ago it ended.
    ['2027-08-16T00:00:00Z', 'ended'],
  ])('at %s is %s', (now, expected) => {
    vi.setSystemTime(new Date(now));
    expect(phaseOf(event())).toBe(expected);
  });
});

describe('isEventArchived', () => {
  it('follows archivedAt', () => {
    expect(isEventArchived(event())).toBe(false);
    expect(
      isEventArchived(event({ archivedAt: '2026-09-01T00:00:00.000Z' })),
    ).toBe(true);
  });
});
