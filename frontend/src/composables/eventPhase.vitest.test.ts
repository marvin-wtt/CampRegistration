import { describe, expect, it } from 'vitest';
import type { Event } from '@camp-registration/common/entities';
import { eventPhaseOf } from '@/composables/eventPhase';

// Arrival at 14:00 on 10.08., departure at 11:00 on 15.08., Berlin summer
// time (UTC+2).
function event(overrides: Partial<Event> = {}): Event {
  return {
    startAt: '2026-08-10T14:00:00',
    endAt: '2026-08-15T11:00:00',
    timezone: 'Europe/Berlin',
    registrationStatus: 'closed',
    registrationOpensAt: '2026-03-01T00:00:00',
    registrationClosesAt: '2026-07-01T00:00:00',
    ...overrides,
  } as unknown as Event;
}

const at = (instant: string) => new Date(instant).getTime();

describe('eventPhaseOf', () => {
  it('runs from midnight of the first day, before arrival', () => {
    expect(eventPhaseOf(event(), at('2026-08-09T21:59:59Z'))).toBe(
      'preparation',
    );
    expect(eventPhaseOf(event(), at('2026-08-09T22:00:00Z'))).toBe('running');
    expect(eventPhaseOf(event(), at('2026-08-10T06:00:00Z'))).toBe('running');
  });

  it('runs until the end of the last day, after departure', () => {
    expect(eventPhaseOf(event(), at('2026-08-15T15:00:00Z'))).toBe('running');
    expect(eventPhaseOf(event(), at('2026-08-15T21:59:59Z'))).toBe('running');
    expect(eventPhaseOf(event(), at('2026-08-15T22:00:00Z'))).toBe('wrapUp');
  });

  it('follows the event timezone, not UTC', () => {
    const tokyo = event({ timezone: 'Asia/Tokyo' });

    // 00:30 on 10.08. in Tokyo is still 09.08. in UTC.
    expect(eventPhaseOf(tokyo, at('2026-08-09T15:30:00Z'))).toBe('running');
  });

  it('keeps a running event running while registration is open', () => {
    const open = event({ registrationStatus: 'open' });

    expect(eventPhaseOf(open, at('2026-08-10T06:00:00Z'))).toBe('running');
    expect(eventPhaseOf(open, at('2026-08-09T06:00:00Z'))).toBe('registration');
  });

  it('is in setup before registration opens, preparation after it closes', () => {
    const before = at('2026-08-01T00:00:00Z');

    expect(
      eventPhaseOf(event({ registrationStatus: 'upcoming' }), before),
    ).toBe('setup');
    expect(eventPhaseOf(event(), before)).toBe('preparation');
  });
});
