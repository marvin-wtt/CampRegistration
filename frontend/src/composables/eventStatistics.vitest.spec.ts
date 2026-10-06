import { describe, expect, it } from 'vitest';
import { splitPlaces, type CapacityGroup } from '@/composables/eventStatistics';

const group = (
  max: number,
  { A = 0, P = 0, W = 0 }: { A?: number; P?: number; W?: number },
): CapacityGroup => ({ max, holding: A + P, waitlisted: W });

describe('splitPlaces', () => {
  // DE 24, FR 25 — the same cases the backend's calculateFreePlaces covers.
  it.each([
    ['no registrations', group(24, {}), group(25, {}), [49, 0, 0]],
    ['DE accepted full', group(24, { A: 24 }), group(25, { A: 20 }), [5, 0, 0]],
    [
      'DE full with pending',
      group(24, { A: 22, P: 2 }),
      group(25, { A: 20 }),
      [5, 0, 0],
    ],
    [
      'DE overbooked by pending',
      group(24, { A: 22, P: 3 }),
      group(25, { A: 20 }),
      [5, 0, 1],
    ],
    [
      'DE full with waiting list',
      group(24, { A: 22, W: 2 }),
      group(25, { A: 20 }),
      [5, 2, 0],
    ],
    [
      'DE waiting list beyond its capacity',
      group(24, { A: 22, W: 3 }),
      group(25, { A: 20 }),
      [5, 2, 0],
    ],
    [
      'places freed in DE are reserved for its waiting list',
      group(24, { A: 20, W: 4 }),
      group(25, { A: 20 }),
      [5, 4, 0],
    ],
    [
      'DE waiting list shorter than the freed places',
      group(24, { A: 20, W: 2 }),
      group(25, { A: 20 }),
      [7, 2, 0],
    ],
    [
      'DE overbooked by accepted',
      group(24, { A: 25 }),
      group(25, { A: 20 }),
      [5, 0, 1],
    ],
    [
      'both overbooked',
      group(24, { A: 26, P: 1 }),
      group(25, { A: 27 }),
      [0, 0, 5],
    ],
    [
      'mixed statuses in both',
      group(24, { A: 10, P: 5 }),
      group(25, { A: 10, P: 5, W: 5 }),
      [14, 5, 0],
    ],
  ])('%s', (_, de, fr, [free, reserved, overbooked]) => {
    expect(splitPlaces([de, fr])).toEqual({ free, reserved, overbooked });
  });

  it('should add up to the capacity when nothing is overbooked', () => {
    const groups = [group(24, { A: 15, P: 3, W: 2 }), group(25, { A: 21 })];
    const { free, reserved } = splitPlaces(groups);
    const holding = groups.reduce((sum, g) => sum + g.holding, 0);

    expect(holding + reserved + free).toBe(49);
  });

  it('should treat a shared capacity as one group', () => {
    expect(splitPlaces([group(49, { A: 40, P: 3, W: 2 })])).toEqual({
      free: 4,
      reserved: 2,
      overbooked: 0,
    });
  });
});
