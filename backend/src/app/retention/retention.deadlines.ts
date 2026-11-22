import { addToDate, daysBetween } from '@camp-registration/common/utils';
import {
  MAX_RETENTION_POSTPONE_MONTHS,
  type EventRetentionDeadlineKind,
  type EventRetentionDeadlineStatus,
  type PrivacyRetention,
  type RetentionPeriods,
} from '@camp-registration/common/privacy';

/** Days before the deadline a reminder goes out; 0 is the deadline itself. */
const RETENTION_REMINDER_STAGES = [30, 0] as const;

/**
 * Days past the deadline a missed reminder still goes out. Older ones only
 * show as overdue, so deploying the workflow mails nothing about old events.
 */
const RETENTION_REMINDER_GRACE_DAYS = 7;

/** Days before the deadline from which it counts as due soon. */
const RETENTION_DUE_SOON_DAYS = 30;

export type DeadlineDates = Record<EventRetentionDeadlineKind, string | null>;

/**
 * The periods a notice's retention states. Notices published before the
 * sensitive period existed promised nothing shorter for sensitive answers, so
 * the main period applies to them.
 */
export function retentionPeriods(
  retention: PrivacyRetention | null | undefined,
  asksSensitive: boolean,
): RetentionPeriods {
  // Composition drops the retention of a free-text notice: no period.
  if (!retention || retention.months <= 0) {
    return { registrations: null, sensitive: null };
  }

  const main = { months: retention.months };
  const special = retention.specialCategories;

  return {
    registrations: main,
    sensitive: !asksSensitive
      ? null
      : special
        ? { weeks: special.weeks }
        : main,
  };
}

/** A period counted from the day the event ends. */
function deadlineOf(
  period: RetentionPeriods['sensitive'],
  eventEnd: string,
): string | null {
  if (!period) {
    return null;
  }

  return 'months' in period
    ? addToDate(eventEnd, { months: period.months })
    : addToDate(eventEnd, { days: period.weeks * 7 });
}

/**
 * What the notices shown to an event's registrants promised.
 *
 * One deadline per kind covers all registrants, so the earliest promise wins:
 * deleting early is allowed, keeping longer than promised is not. Sensitive
 * data is a subset of the registration data, so its deadline is never later.
 */
export function promisedDeadlines(
  periods: RetentionPeriods[],
  eventEnd: string,
): DeadlineDates {
  const earliest = (kind: EventRetentionDeadlineKind) =>
    periods
      .map((entry) => deadlineOf(entry[kind], eventEnd))
      .filter((date) => date !== null)
      .sort()[0] ?? null;

  const registrations = earliest('registrations');

  return {
    registrations,
    sensitive: earlierOf(earliest('sensitive'), registrations),
  };
}

/**
 * The dates in force after postponing. A postponement only ever moves a date
 * later, so one the promise has since reached changes nothing. The sensitive
 * date never passes the general one.
 */
export function effectiveDeadlines(
  promised: DeadlineDates,
  postponed: DeadlineDates,
): DeadlineDates {
  const registrations = laterOf(
    promised.registrations,
    postponed.registrations,
  );

  return {
    registrations,
    sensitive: earlierOf(
      laterOf(promised.sensitive, postponed.sensitive),
      registrations,
    ),
  };
}

export function deadlineStatus(
  effectiveAt: string,
  today: string,
): EventRetentionDeadlineStatus {
  const daysLeft = daysBetween(today, effectiveAt);
  if (daysLeft < 0) {
    return 'overdue';
  }

  return daysLeft <= RETENTION_DUE_SOON_DAYS ? 'due_soon' : 'upcoming';
}

/**
 * The dates a postponement may choose: after both today and the date in
 * force, within the next months, and for sensitive data not past the general
 * date. Null when that leaves nothing.
 */
export function postponeRange(
  kind: EventRetentionDeadlineKind,
  effective: DeadlineDates,
  today: string,
): { min: string; max: string } | null {
  const current = effective[kind];
  if (!current) {
    return null;
  }

  const min = addToDate(current > today ? current : today, { days: 1 });
  const limit = addToDate(today, { months: MAX_RETENTION_POSTPONE_MONTHS });
  const max =
    kind === 'sensitive'
      ? (earlierOf(limit, effective.registrations) ?? limit)
      : limit;

  return min <= max ? { min, max } : null;
}

/**
 * The most urgent reminder stage reached, or null while further away or
 * past the grace period.
 */
export function reminderStage(
  effectiveAt: string,
  today: string,
): number | null {
  const daysLeft = daysBetween(today, effectiveAt);
  if (daysLeft < -RETENTION_REMINDER_GRACE_DAYS) {
    return null;
  }

  const reached = RETENTION_REMINDER_STAGES.filter(
    (stage) => daysLeft <= stage,
  );

  return reached.length > 0 ? Math.min(...reached) : null;
}

function earlierOf(date: string | null, bound: string | null): string | null {
  return date && bound && bound < date ? bound : date;
}

function laterOf(date: string | null, other: string | null): string | null {
  return date && other && other > date ? other : date;
}
