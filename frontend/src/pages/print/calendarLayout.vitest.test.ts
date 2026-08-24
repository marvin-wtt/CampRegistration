import { describe, expect, it } from 'vitest';
import type { ProgramEvent } from '@camp-registration/common/entities';
import {
  COMPACT_EVENT_H_PX,
  fillColor,
  formatMinutesAsTime,
  layoutDayEvents,
  MIN_EVENT_H_PX,
  type DayLayoutOptions,
} from '@/pages/print/calendarLayout';

// 08:00 start, 30 min slots of 28px — the defaults of the program planner.
const OPTIONS: DayLayoutOptions = {
  dayStartMinutes: 480,
  interval: 30,
  slotHeight: 28,
  splitPlans: false,
};

function event(
  id: string,
  time: string | null,
  duration: number | null,
  plan: ProgramEvent['plan'] = 'both',
): ProgramEvent {
  return {
    id,
    title: id,
    details: null,
    location: null,
    date: '2026-08-23',
    time,
    duration,
    color: null,
    plan,
  };
}

function spanOf(box: { x0: number; x1: number }): [number, number] {
  return [box.x0, box.x1];
}

describe('layoutDayEvents', () => {
  it('positions an event from its start and duration', () => {
    const [box] = layoutDayEvents([event('a', '09:00', 90)], OPTIONS);

    // 09:00 is two slots below the 08:00 start; 90 min is three slots tall.
    expect(box?.top).toBe(56);
    expect(box?.height).toBe(3 * 28 - 1);
    expect(spanOf(box!)).toEqual([0, 1]);
  });

  it('keeps a very short event tall enough to hold a line of text', () => {
    const [box] = layoutDayEvents([event('a', '09:00', 5)], OPTIONS);

    expect(box?.height).toBe(MIN_EVENT_H_PX);
    expect(box?.compact).toBe(true);
  });

  it('marks only boxes below the compact threshold as compact', () => {
    const [short, tall] = layoutDayEvents(
      [event('a', '09:00', 15), event('b', '11:00', 60)],
      OPTIONS,
    );

    expect(short?.height).toBeLessThan(COMPACT_EVENT_H_PX);
    expect(short?.compact).toBe(true);
    expect(tall?.compact).toBe(false);
  });

  it('skips events without a usable time or duration', () => {
    const boxes = layoutDayEvents(
      [
        event('no-time', null, 60),
        event('no-duration', '09:00', null),
        event('bad-time', '25:61', 60),
        event('ok', '09:00', 60),
      ],
      OPTIONS,
    );

    expect(boxes.map((box) => box.event.id)).toEqual(['ok']);
  });

  it('leaves events that do not overlap at full width', () => {
    const boxes = layoutDayEvents(
      [event('a', '09:00', 60), event('b', '10:00', 60)],
      OPTIONS,
    );

    expect(boxes.map(spanOf)).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it('puts overlapping events side by side instead of on top of each other', () => {
    const boxes = layoutDayEvents(
      [event('a', '09:00', 60), event('b', '09:30', 60)],
      OPTIONS,
    );

    expect(boxes.map(spanOf)).toEqual([
      [0, 0.5],
      [0.5, 1],
    ]);
  });

  it('divides the column between three events overlapping at the same time', () => {
    const boxes = layoutDayEvents(
      [
        event('a', '09:00', 60),
        event('b', '09:00', 60),
        event('c', '09:00', 60),
      ],
      OPTIONS,
    );

    expect(boxes.map(spanOf)).toEqual([
      [0, 1 / 3],
      [1 / 3, 2 / 3],
      [2 / 3, 1],
    ]);
  });

  it('reuses a lane once it is free again', () => {
    const boxes = layoutDayEvents(
      [
        event('long', '09:00', 180),
        event('early', '09:00', 60),
        event('late', '10:30', 60),
      ],
      OPTIONS,
    );

    const spans = Object.fromEntries(
      boxes.map((box) => [box.event.id, spanOf(box)]),
    );
    expect(spans.long).toEqual([0, 0.5]);
    expect(spans.early).toEqual([0.5, 1]);
    // `early` has ended by 10:30, so `late` takes its lane back.
    expect(spans.late).toEqual([0.5, 1]);
  });

  describe('with both plans in one column', () => {
    const splitOptions = { ...OPTIONS, splitPlans: true };

    it('gives each plan its own half without narrowing either', () => {
      const boxes = layoutDayEvents(
        [event('a', '09:00', 60, 'a'), event('b', '09:00', 60, 'b')],
        splitOptions,
      );

      expect(boxes.map(spanOf)).toEqual([
        [0, 0.5],
        [0.5, 1],
      ]);
    });

    it('packs the events of one plan within that plan half', () => {
      const boxes = layoutDayEvents(
        [
          event('a1', '09:00', 60, 'a'),
          event('a2', '09:30', 60, 'a'),
          event('b1', '09:00', 60, 'b'),
        ],
        splitOptions,
      );

      const spans = Object.fromEntries(
        boxes.map((box) => [box.event.id, spanOf(box)]),
      );
      expect(spans.a1).toEqual([0, 0.25]);
      expect(spans.a2).toEqual([0.25, 0.5]);
      expect(spans.b1).toEqual([0.5, 1]);
    });

    it('splits the full width when a shared event overlaps a plan event', () => {
      const boxes = layoutDayEvents(
        [event('shared', '09:00', 60, 'both'), event('a', '09:30', 60, 'a')],
        splitOptions,
      );

      expect(boxes.map(spanOf)).toEqual([
        [0, 0.5],
        [0.5, 1],
      ]);
    });
  });
});

describe('fillColor', () => {
  it('washes a colour out over white', () => {
    // 18% of #000000 over white leaves a light grey.
    expect(fillColor('#000000')).toBe('rgb(209, 209, 209)');
    expect(fillColor('#ffffff')).toBe('rgb(255, 255, 255)');
  });

  it('accepts short and alpha hex notations', () => {
    expect(fillColor('#f00')).toBe(fillColor('#ff0000'));
    expect(fillColor('#ff000080')).toBe(fillColor('#ff0000'));
  });

  it('falls back to a neutral fill for anything it cannot parse', () => {
    expect(fillColor('rebeccapurple')).toBe('#f2f2f2');
    expect(fillColor('')).toBe('#f2f2f2');
  });
});

describe('formatMinutesAsTime', () => {
  it('pads to HH:MM', () => {
    expect(formatMinutesAsTime(0)).toBe('00:00');
    expect(formatMinutesAsTime(545)).toBe('09:05');
  });

  it('wraps an event running past midnight', () => {
    expect(formatMinutesAsTime(1470)).toBe('00:30');
  });
});
