import { describe, expect, it } from 'vitest';
import { splitPlaces } from '@/composables/eventStatistics';

describe('splitPlaces', () => {
  it('keeps places freed while people wait for the waiting list', () => {
    expect(splitPlaces([{ max: 20, holding: 17, waitlisted: 5 }])).toEqual({
      free: 0,
      reserved: 3,
      overbooked: 0,
    });
  });

  it('frees only what the waiting list cannot fill', () => {
    expect(splitPlaces([{ max: 20, holding: 15, waitlisted: 2 }])).toEqual({
      free: 3,
      reserved: 2,
      overbooked: 0,
    });
  });

  it('never offers one group’s places to another group’s waiting list', () => {
    expect(
      splitPlaces([
        { max: 10, holding: 7, waitlisted: 0 },
        { max: 10, holding: 10, waitlisted: 4 },
      ]),
    ).toEqual({ free: 3, reserved: 0, overbooked: 0 });
  });

  it('reserves nothing in an overbooked group', () => {
    expect(splitPlaces([{ max: 10, holding: 12, waitlisted: 3 }])).toEqual({
      free: 0,
      reserved: 0,
      overbooked: 2,
    });
  });
});
