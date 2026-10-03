import { describe, expect, it } from 'vitest';
import { calculateFreePlaces } from '#app/event/event.util';

type Status = 'ACCEPTED' | 'PENDING' | 'WAITLISTED';

interface Group {
  A?: number;
  P?: number;
  W?: number;
}

// Status is carried along to show what each case models — the calculation
// itself must not depend on it.
const people = (
  country: string | null,
  { A = 0, P = 0, W = 0 }: Group,
): { country: string | null; status: Status }[] => [
  ...Array.from({ length: A }, () => ({
    country,
    status: 'ACCEPTED' as const,
  })),
  ...Array.from({ length: P }, () => ({ country, status: 'PENDING' as const })),
  ...Array.from({ length: W }, () => ({
    country,
    status: 'WAITLISTED' as const,
  })),
];

describe('calculateFreePlaces', () => {
  describe('per-country capacity (DE 24, FR 25)', () => {
    const capacity = { de: 24, fr: 25 };

    it.each<[string, Group, Group, { de: number; fr: number }, number]>([
      ['no registrations', {}, {}, { de: 24, fr: 25 }, 49],
      ['DE accepted full', { A: 24 }, { A: 20 }, { de: 0, fr: 5 }, 5],
      ['DE full with pending', { A: 22, P: 2 }, { A: 20 }, { de: 0, fr: 5 }, 5],
      [
        'DE overbooked by pending',
        { A: 22, P: 3 },
        { A: 20 },
        { de: 0, fr: 5 },
        5,
      ],
      [
        'DE full with waiting list',
        { A: 22, W: 2 },
        { A: 20 },
        { de: 0, fr: 5 },
        5,
      ],
      [
        'DE waiting list beyond its capacity',
        { A: 22, W: 3 },
        { A: 20 },
        { de: 0, fr: 5 },
        5,
      ],
      ['DE with room', { A: 20 }, { A: 20 }, { de: 4, fr: 5 }, 9],
      [
        'places freed in DE are reserved for its waiting list',
        { A: 20, W: 4 },
        { A: 20 },
        { de: 0, fr: 5 },
        5,
      ],
      [
        'DE waiting list shorter than the freed places',
        { A: 20, W: 2 },
        { A: 20 },
        { de: 2, fr: 5 },
        7,
      ],
      [
        'DE with all three statuses',
        { A: 20, P: 2, W: 1 },
        { A: 20 },
        { de: 1, fr: 5 },
        6,
      ],
      ['DE overbooked by accepted', { A: 25 }, { A: 20 }, { de: 0, fr: 5 }, 5],
      [
        'waitlisted accepted ahead of pending in DE',
        { A: 23, P: 2 },
        { A: 20 },
        { de: 0, fr: 5 },
        5,
      ],
      [
        'FR full through pending',
        { A: 20 },
        { A: 20, P: 5 },
        { de: 4, fr: 0 },
        4,
      ],
      ['both full', { A: 24 }, { A: 25 }, { de: 0, fr: 0 }, 0],
      [
        'both full with waiting lists',
        { A: 24, W: 3 },
        { A: 25, W: 1 },
        { de: 0, fr: 0 },
        0,
      ],
      ['both overbooked', { A: 26, P: 1 }, { A: 27 }, { de: 0, fr: 0 }, 0],
      [
        'mixed statuses in both',
        { A: 10, P: 5 },
        { A: 10, P: 5, W: 5 },
        { de: 9, fr: 5 },
        14,
      ],
    ])('%s', (_, de, fr, freePlaces, freePlacesTotal) => {
      const registrations = [...people('de', de), ...people('fr', fr)];

      expect(calculateFreePlaces(capacity, registrations)).toEqual({
        freePlaces,
        freePlacesTotal,
      });
    });

    it('should never let an overbooked country take places from another', () => {
      const registrations = [
        ...people('de', { A: 30, P: 5, W: 10 }),
        ...people('fr', { A: 20 }),
      ];

      expect(calculateFreePlaces(capacity, registrations)).toEqual({
        freePlaces: { de: 0, fr: 5 },
        freePlacesTotal: 5,
      });
    });

    it('should ignore registrations outside every country', () => {
      const registrations = [
        ...people('de', { A: 20 }),
        ...people(null, { A: 3 }),
        ...people('it', { A: 2, W: 1 }),
      ];

      expect(calculateFreePlaces(capacity, registrations)).toEqual({
        freePlaces: { de: 4, fr: 25 },
        freePlacesTotal: 29,
      });
    });

    it('should equal the sum of the per-country free places', () => {
      const { freePlaces, freePlacesTotal } = calculateFreePlaces(capacity, [
        ...people('de', { A: 7, P: 3, W: 2 }),
        ...people('fr', { A: 12, W: 4 }),
      ]);

      expect(freePlacesTotal).toBe(
        Object.values(freePlaces as Record<string, number>).reduce(
          (sum, v) => sum + v,
          0,
        ),
      );
    });
  });

  describe('shared capacity (49)', () => {
    it.each<[string, Group, number]>([
      ['no registrations', {}, 49],
      ['accepted and pending', { A: 40, P: 5 }, 4],
      ['full with pending', { A: 44, P: 5 }, 0],
      ['full with waiting list', { A: 44, W: 5 }, 0],
      ['freed places are reserved for the waiting list', { A: 45, W: 4 }, 0],
      ['waiting list shorter than the freed places', { A: 40, W: 4 }, 5],
      ['overbooked', { A: 50, P: 2, W: 3 }, 0],
    ])('%s', (_, group, free) => {
      expect(calculateFreePlaces(49, people('de', group))).toEqual({
        freePlaces: free,
        freePlacesTotal: free,
      });
    });

    it('should count registrations without a country', () => {
      const registrations = [
        ...people('de', { A: 20 }),
        ...people(null, { A: 4 }),
      ];

      expect(calculateFreePlaces(49, registrations)).toEqual({
        freePlaces: 25,
        freePlacesTotal: 25,
      });
    });
  });
});
