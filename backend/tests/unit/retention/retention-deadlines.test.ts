import { describe, expect, it } from 'vitest';
import {
  emptyPrivacyNoticeContent,
  type PrivacyNoticeContent,
} from '@camp-registration/common/privacy';
import {
  daysUntil,
  promisedDeadlines,
  reminderStage,
  type NoticeStamp,
} from '#app/retention/retention.deadlines';

const endAt = new Date('2026-08-15T12:00:00.000Z');

function notice(retention: object): PrivacyNoticeContent {
  return {
    ...emptyPrivacyNoticeContent(),
    retention,
  } as PrivacyNoticeContent;
}

function stamp(id: string, firstAt: string | null): NoticeStamp {
  return {
    organizationPrivacyNoticeVersionId: id,
    eventPrivacyNoticeVersionId: null,
    _min: { createdAt: firstAt ? new Date(firstAt) : null },
  };
}

function lookup(contents: Record<string, PrivacyNoticeContent>) {
  return (id: string | null) => (id ? (contents[id] ?? null) : null);
}

describe('promisedDeadlines', () => {
  it('counts from the event end', () => {
    const result = promisedDeadlines(
      [stamp('a', '2026-03-01T10:00:00.000Z')],
      lookup({ a: notice({ months: 6, anchor: 'event_end', exceptions: [] }) }),
      endAt,
    );

    expect(result.registrations?.toISOString()).toBe(
      '2027-02-15T12:00:00.000Z',
    );
  });

  it('counts from the first registration a version covers', () => {
    const result = promisedDeadlines(
      [stamp('a', '2026-03-01T10:00:00.500Z')],
      lookup({
        a: notice({
          months: 6,
          anchor: 'submission',
          exceptions: [],
          specialCategories: { weeks: 4, anchor: 'submission' },
        }),
      }),
      endAt,
    );

    // Whole seconds, as the column stores them.
    expect(result.registrations?.toISOString()).toBe(
      '2026-09-01T10:00:00.000Z',
    );
    expect(result.sensitive?.toISOString()).toBe('2026-03-29T10:00:00.000Z');
  });

  it('keeps the earliest promise across versions', () => {
    const result = promisedDeadlines(
      [stamp('long', '2026-01-01T00:00:00.000Z'), stamp('short', null)],
      lookup({
        long: notice({ months: 12, anchor: 'event_end', exceptions: [] }),
        short: notice({ months: 3, anchor: 'event_end', exceptions: [] }),
      }),
      endAt,
    );

    expect(result.registrations?.toISOString()).toBe(
      '2026-11-15T12:00:00.000Z',
    );
  });

  it('puts sensitive answers under the main period for older notices', () => {
    const result = promisedDeadlines(
      [stamp('a', null)],
      lookup({ a: notice({ months: 6, anchor: 'event_end', exceptions: [] }) }),
      endAt,
    );

    expect(result.sensitive).toEqual(result.registrations);
  });

  it('promises nothing without a period', () => {
    const result = promisedDeadlines(
      [stamp('a', null)],
      lookup({ a: notice({ months: 0, anchor: 'event_end', exceptions: [] }) }),
      endAt,
    );

    expect(result).toEqual({ registrations: null, sensitive: null });
  });
});

describe('reminderStage', () => {
  const now = new Date('2026-11-20T23:00:00.000Z');
  const inDays = (days: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  it('is null while further away than the first stage', () => {
    expect(reminderStage(inDays(31), now)).toBeNull();
  });

  it('reaches the first stage 30 days ahead', () => {
    expect(reminderStage(inDays(30), now)).toBe(30);
    expect(reminderStage(inDays(5), now)).toBe(30);
  });

  it('reaches the last stage on and after the deadline', () => {
    expect(reminderStage(inDays(0), now)).toBe(0);
    expect(reminderStage(inDays(-10), now)).toBe(0);
  });

  it('counts UTC calendar days', () => {
    expect(daysUntil(new Date('2026-11-21T00:30:00.000Z'), now)).toBe(1);
  });
});
