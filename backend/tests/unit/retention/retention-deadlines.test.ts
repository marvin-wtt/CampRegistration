import { describe, expect, it } from 'vitest';
import {
  deadlineStatus,
  effectiveDeadlines,
  postponeRange,
  promisedDeadlines,
  reminderStage,
  retentionPeriods,
} from '#app/retention/retention.deadlines';

const anchors = { eventEnd: '2026-08-15', firstRegistration: '2026-03-01' };

const periods = (retention: object, asksSensitive = true) =>
  retentionPeriods(
    { exceptions: [], ...retention } as unknown as Parameters<
      typeof retentionPeriods
    >[0],
    asksSensitive,
  );

describe('promisedDeadlines', () => {
  it('counts from the event end', () => {
    const result = promisedDeadlines(
      [
        periods({
          months: 6,
          anchor: 'event_end',
          specialCategories: { weeks: 4, anchor: 'event_end' },
        }),
      ],
      anchors,
    );

    expect(result).toEqual({
      registrations: '2027-02-15',
      sensitive: '2026-09-12',
    });
  });

  it('counts from the first registration', () => {
    const result = promisedDeadlines(
      [periods({ months: 6, anchor: 'submission' })],
      anchors,
    );

    expect(result.registrations).toBe('2026-09-01');
  });

  it('has no date counted from submission before anyone registered', () => {
    const result = promisedDeadlines(
      [periods({ months: 6, anchor: 'submission' })],
      { ...anchors, firstRegistration: null },
    );

    expect(result).toEqual({ registrations: null, sensitive: null });
  });

  it('keeps the earliest promise across notices', () => {
    const result = promisedDeadlines(
      [
        periods({ months: 12, anchor: 'event_end' }),
        periods({ months: 3, anchor: 'event_end' }),
      ],
      anchors,
    );

    expect(result.registrations).toBe('2026-11-15');
  });

  it('puts sensitive answers under the main period for older notices', () => {
    const result = promisedDeadlines(
      [periods({ months: 6, anchor: 'event_end' })],
      anchors,
    );

    expect(result.sensitive).toBe(result.registrations);
  });

  it('never lets the sensitive date pass the general one', () => {
    const result = promisedDeadlines(
      [
        periods({ months: 1, anchor: 'submission' }),
        periods({
          months: 12,
          anchor: 'event_end',
          specialCategories: { weeks: 8, anchor: 'event_end' },
        }),
      ],
      anchors,
    );

    expect(result).toEqual({
      registrations: '2026-04-01',
      sensitive: '2026-04-01',
    });
  });

  it('has no sensitive date for a form without sensitive questions', () => {
    const result = promisedDeadlines(
      [periods({ months: 6, anchor: 'event_end' }, false)],
      anchors,
    );

    expect(result.sensitive).toBeNull();
  });

  it('promises nothing without a period', () => {
    const result = promisedDeadlines(
      [periods({ months: 0, anchor: 'event_end' })],
      anchors,
    );

    expect(result).toEqual({ registrations: null, sensitive: null });
  });
});

describe('effectiveDeadlines', () => {
  const promised = { registrations: '2027-02-15', sensitive: '2026-09-12' };

  it('moves a postponed date later', () => {
    expect(
      effectiveDeadlines(promised, {
        registrations: '2027-06-01',
        sensitive: null,
      }),
    ).toEqual({ registrations: '2027-06-01', sensitive: '2026-09-12' });
  });

  it('ignores a postponement the promise has reached', () => {
    expect(
      effectiveDeadlines(promised, {
        registrations: '2027-01-01',
        sensitive: null,
      }).registrations,
    ).toBe('2027-02-15');
  });

  it('caps a sensitive postponement at the general date', () => {
    expect(
      effectiveDeadlines(
        { registrations: '2026-11-01', sensitive: '2026-09-12' },
        { registrations: null, sensitive: '2027-01-01' },
      ).sensitive,
    ).toBe('2026-11-01');
  });
});

describe('postponeRange', () => {
  const effective = { registrations: '2027-02-15', sensitive: '2026-09-12' };

  it('starts after the date in force and ends 12 months from today', () => {
    expect(postponeRange('registrations', effective, '2026-12-01')).toEqual({
      min: '2027-02-16',
      max: '2027-12-01',
    });
  });

  it('starts tomorrow for an overdue date', () => {
    expect(postponeRange('sensitive', effective, '2026-12-01')).toEqual({
      min: '2026-12-02',
      max: '2027-02-15',
    });
  });

  it('leaves nothing for a sensitive date already at the general one', () => {
    expect(
      postponeRange(
        'sensitive',
        { registrations: '2027-02-15', sensitive: '2027-02-15' },
        '2026-12-01',
      ),
    ).toBeNull();
  });
});

describe('deadlineStatus', () => {
  it('is due soon within 30 days and overdue only after the day', () => {
    expect(deadlineStatus('2027-01-01', '2026-12-01')).toBe('upcoming');
    expect(deadlineStatus('2026-12-31', '2026-12-01')).toBe('due_soon');
    expect(deadlineStatus('2026-12-01', '2026-12-01')).toBe('due_soon');
    expect(deadlineStatus('2026-11-30', '2026-12-01')).toBe('overdue');
  });
});

describe('reminderStage', () => {
  const today = '2026-11-20';

  it('is null while further away than the first stage', () => {
    expect(reminderStage('2026-12-21', today)).toBeNull();
  });

  it('reaches the first stage 30 days ahead', () => {
    expect(reminderStage('2026-12-20', today)).toBe(30);
    expect(reminderStage('2026-11-25', today)).toBe(30);
  });

  it('reaches the last stage on the deadline and for a week after', () => {
    expect(reminderStage('2026-11-20', today)).toBe(0);
    expect(reminderStage('2026-11-13', today)).toBe(0);
  });

  it('sends nothing for a deadline more than a week overdue', () => {
    expect(reminderStage('2026-11-12', today)).toBeNull();
  });
});
