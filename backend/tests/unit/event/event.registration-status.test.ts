import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Event } from '#generated/prisma/client';
import { eventRegistrationStatus } from '#app/event/event.util';

// Starts at 11:00 Berlin summer time (09:00 UTC); stored as a UTC carrier.
function event(overrides: Partial<Event> = {}): Event {
  return {
    startAt: new Date('2026-08-15T11:00:00Z'),
    timezone: 'Europe/Berlin',
    registrationOpensAt: null,
    registrationClosesAt: null,
    ...overrides,
  } as Event;
}

describe('eventRegistrationStatus', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is upcoming without a window until the event starts', () => {
    vi.setSystemTime(new Date('2026-08-15T08:59:59Z'));
    expect(eventRegistrationStatus(event())).toBe('upcoming');

    vi.setSystemTime(new Date('2026-08-15T09:00:00Z'));
    expect(eventRegistrationStatus(event())).toBe('closed');
  });

  it('follows the window when one is set', () => {
    vi.setSystemTime(new Date('2026-05-01T00:00:00Z'));

    expect(
      eventRegistrationStatus(
        event({ registrationOpensAt: new Date('2026-06-01T00:00:00Z') }),
      ),
    ).toBe('upcoming');
    expect(
      eventRegistrationStatus(
        event({ registrationClosesAt: new Date('2026-04-01T00:00:00Z') }),
      ),
    ).toBe('closed');
    expect(
      eventRegistrationStatus(
        event({ registrationOpensAt: new Date('2026-04-01T00:00:00Z') }),
      ),
    ).toBe('open');
  });
});
