import { describe, expect, it } from 'vitest';
import {
  datePresetRange,
  dayRangeToIso,
  isoToDay,
  matchingDatePreset,
} from '@/components/listedEvents/filters';

/** Local time, matching how the picker and the presets both build their days. */
function day(iso: string): string {
  const date = new Date(iso);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

describe('datePresetRange', () => {
  const march15 = new Date(2026, 2, 15, 10, 30);

  it('opens every window today — an already started event cannot be joined', () => {
    for (const preset of ['this_month', 'next_3_months'] as const) {
      expect(day(datePresetRange(preset, march15).startAt)).toBe('2026-03-15');
    }
  });

  it('ends "this month" on the last day of the current month', () => {
    expect(day(datePresetRange('this_month', march15).endAt)).toBe(
      '2026-03-31',
    );
  });

  it('carries "next 3 months" three months forward', () => {
    expect(day(datePresetRange('next_3_months', march15).endAt)).toBe(
      '2026-06-15',
    );
  });
});

describe('matchingDatePreset', () => {
  const march15 = new Date(2026, 2, 15, 10, 30);

  it('recognizes the range a preset produced', () => {
    const range = datePresetRange('this_month', march15);

    expect(matchingDatePreset(range.startAt, range.endAt, march15)).toBe(
      'this_month',
    );
  });

  it('matches on the day, not on the time of day', () => {
    const range = datePresetRange('this_month', march15);
    const noonStart = new Date(range.startAt);
    noonStart.setHours(12, 0);

    expect(
      matchingDatePreset(noonStart.toISOString(), range.endAt, march15),
    ).toBe('this_month');
  });

  it('reports no preset for a hand-picked range', () => {
    expect(
      matchingDatePreset(
        new Date(2026, 3, 2, 0, 0).toISOString(),
        new Date(2026, 3, 9, 23, 59).toISOString(),
        march15,
      ),
    ).toBeUndefined();
  });

  it('reports no preset for a half-open range', () => {
    const range = datePresetRange('this_month', march15);

    expect(
      matchingDatePreset(range.startAt, undefined, march15),
    ).toBeUndefined();
  });
});

describe('dayRangeToIso', () => {
  it('covers the picked days from their first to their last moment', () => {
    const range = dayRangeToIso('2026-07-04', '2026-08-15');
    const from = new Date(range.startAt);
    const to = new Date(range.endAt);

    expect(day(range.startAt)).toBe('2026-07-04');
    expect([from.getHours(), from.getMinutes()]).toEqual([0, 0]);
    expect(day(range.endAt)).toBe('2026-08-15');
    expect([to.getHours(), to.getMinutes()]).toEqual([23, 59]);
  });

  it('round-trips through isoToDay', () => {
    const range = dayRangeToIso('2026-07-04', '2026-08-15');

    expect(isoToDay(range.startAt)).toBe('2026-07-04');
    expect(isoToDay(range.endAt)).toBe('2026-08-15');
  });

  it('accepts a single day as both ends', () => {
    const range = dayRangeToIso('2026-07-04', '2026-07-04');

    expect(isoToDay(range.startAt)).toBe(isoToDay(range.endAt));
  });
});
