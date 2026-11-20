import type { RetentionAnchor } from './content.js';

/**
 * The retention workflow (docs/privacy.md, 8): one deadline per kind of an
 * event's registration data, reminded about and shown, never acted on
 * automatically. What must be kept beyond it is the organizer's decision.
 */
export const EVENT_RETENTION_DEADLINE_KINDS = [
  'sensitive',
  'registrations',
] as const;

export type EventRetentionDeadlineKind =
  (typeof EVENT_RETENTION_DEADLINE_KINDS)[number];

/** How far ahead one postponement may move a deadline. */
export const MAX_RETENTION_POSTPONE_MONTHS = 12;

/** Days before the deadline a reminder goes out; 0 is the deadline itself. */
export const RETENTION_REMINDER_STAGES = [30, 0] as const;

/** Days before the deadline from which it counts as due soon. */
export const RETENTION_DUE_SOON_DAYS = 30;

export type EventRetentionDeadlineStatus =
  'upcoming' | 'due_soon' | 'overdue' | 'resolved';

export function eventRetentionDeadlineStatus(
  effectiveAt: Date,
  resolvedAt: Date | null,
  now: Date = new Date(),
): EventRetentionDeadlineStatus {
  if (resolvedAt) {
    return 'resolved';
  }
  if (effectiveAt.getTime() < now.getTime()) {
    return 'overdue';
  }
  const dueSoonFrom =
    effectiveAt.getTime() - RETENTION_DUE_SOON_DAYS * 24 * 60 * 60 * 1000;

  return now.getTime() >= dueSoonFrom ? 'due_soon' : 'upcoming';
}

export interface RetentionPostponement {
  until: string;
  /** Only shown to the event's managers; overviews leave it out. */
  reason?: string;
  postponedAt: string;
  postponedBy: string | null;
}

export interface EventRetentionDeadline {
  id: string;
  eventId: string;
  kind: EventRetentionDeadlineKind;
  /** What the notices shown to the registrants promised. */
  dueAt: string;
  /** `postponement.until` if postponed, else `dueAt`. */
  effectiveAt: string;
  status: EventRetentionDeadlineStatus;
  postponement: RetentionPostponement | null;
  resolvedAt: string | null;
}

export interface RetentionPostponeData {
  reason: string;
  /** `YYYY-MM-DD`. */
  until: string;
}

/**
 * The periods the event's current notice states. Deadlines are derived from
 * the notices registrants were actually shown; these say what new ones get.
 */
export interface RetentionPeriods {
  /** Null for a free-text notice or none at all. */
  registrations: { months: number; anchor: RetentionAnchor } | null;
  /**
   * Null when the form asks nothing sensitive. In months when an older
   * notice states no sensitive period, so the main one applies.
   */
  sensitive:
    | { weeks: number; anchor: RetentionAnchor }
    | { months: number; anchor: RetentionAnchor }
    | null;
}

/** What the event's data settings show and act on. */
export interface EventRetention {
  deadlines: EventRetentionDeadline[];
  periods: RetentionPeriods;
  /** When each kind was deleted for good; the server's one rule for it. */
  purged: Record<EventRetentionDeadlineKind, string | null>;
  /** The sensitive deletion was marked but did not finish: run it again. */
  sensitivePurgeIncomplete: boolean;
  registrationCount: number;
}

/** A row of the organization overview: no personal data. */
export interface RetentionOverviewEntry {
  deadlineId: string;
  eventId: string;
  eventName: string | Record<string, string>;
  kind: EventRetentionDeadlineKind;
  effectiveAt: string;
  status: EventRetentionDeadlineStatus;
  postponed: boolean;
}
