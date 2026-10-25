import { describe, expect, it } from 'vitest';
import { groupFreePlaces } from '@/utils/eventAvailability';

const event = (
  freePlaces: number | Record<string, number> | null,
  maxParticipants: number | Record<string, number> = { de: 10, fr: 10 },
) => ({ countries: ['de', 'fr'], freePlaces, maxParticipants });

describe('groupFreePlaces', () => {
  it("is a group's own free places when each group has a limit", () => {
    expect(groupFreePlaces(event({ de: 3, fr: 0 }), 'de')).toBe(3);
    expect(groupFreePlaces(event({ de: 3, fr: 0 }), 'fr')).toBe(0);
  });

  it('is null when the groups share one limit', () => {
    expect(groupFreePlaces(event(4, 20), 'de')).toBeNull();
  });

  it("is null when the event doesn't publish its free places", () => {
    expect(groupFreePlaces(event(null), 'de')).toBeNull();
  });

  it('is null for a group without its own count', () => {
    expect(groupFreePlaces(event({ de: 3, fr: 1 }), 'pl')).toBeNull();
  });
});
