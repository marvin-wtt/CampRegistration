import { describe, expect, it } from 'vitest';
import { rosterPages } from './printChoreRoster';

describe('rosterPages', () => {
  it('fits up to ten days on one page', () => {
    expect(rosterPages('2026-07-01', '2026-07-10')).toEqual([
      { start: '2026-07-01', days: 10 },
    ]);
  });

  it('splits longer ranges evenly', () => {
    expect(rosterPages('2026-07-01', '2026-07-14')).toEqual([
      { start: '2026-07-01', days: 7 },
      { start: '2026-07-08', days: 7 },
    ]);
    expect(rosterPages('2026-07-01', '2026-07-23')).toEqual([
      { start: '2026-07-01', days: 8 },
      { start: '2026-07-09', days: 8 },
      { start: '2026-07-17', days: 7 },
    ]);
  });

  it('starts on the first day, whatever the weekday', () => {
    // 2026-07-03 is a Friday.
    expect(rosterPages('2026-07-03', '2026-07-05')).toEqual([
      { start: '2026-07-03', days: 3 },
    ]);
  });

  it('has no pages for a reversed range', () => {
    expect(rosterPages('2026-07-05', '2026-07-01')).toEqual([]);
  });
});
