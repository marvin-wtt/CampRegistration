import type { RetentionAnchor } from './content.js';

/**
 * The retention workflow (docs/privacy.md, 8): one deadline per kind of an
 * event's registration data, reminded about and shown, never acted on
 * automatically. What must be kept beyond it is the organizer's decision.
 * Every date here is a calendar date (`YYYY-MM-DD`) in the event's time zone.
 */
export const EVENT_RETENTION_DEADLINE_KINDS = [
  'sensitive',
  'registrations',
] as const;

export type EventRetentionDeadlineKind =
  (typeof EVENT_RETENTION_DEADLINE_KINDS)[number];

/** How far ahead one postponement may move a deadline. */
export const MAX_RETENTION_POSTPONE_MONTHS = 12;

export type EventRetentionDeadlineStatus = 'upcoming' | 'due_soon' | 'overdue';

export interface RetentionPostponement {
  until: string;
  /** Only shown to the event's managers; overviews leave it out. */
  reason?: string;
  /** ISO 8601. */
  postponedAt: string;
  postponedBy: string | null;
}

/** A deadline whose data is not deleted yet. */
export interface EventRetentionDeadline {
  kind: EventRetentionDeadlineKind;
  /** The earliest date the notices shown to the registrants promised. */
  dueAt: string;
  /** `postponement.until` if postponed, else `dueAt`. */
  effectiveAt: string;
  status: EventRetentionDeadlineStatus;
  postponement: RetentionPostponement | null;
  /** The dates a postponement may choose from; null when none is left. */
  postponeRange: { min: string; max: string } | null;
}

export interface RetentionPostponeData {
  reason: string;
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
  /** Open deadlines; a kind without registrations or deleted has none. */
  deadlines: EventRetentionDeadline[];
  /**
   * The date the current notice would give a kind that has no deadline yet;
   * null where it cannot tell (counted from submission, or no period).
   */
  estimates: Record<EventRetentionDeadlineKind, string | null>;
  periods: RetentionPeriods;
  /** When each kind was deleted for good (ISO 8601). */
  purged: Record<EventRetentionDeadlineKind, string | null>;
}

/** A row of the organization overview: no personal data. */
export interface RetentionOverviewEntry {
  eventId: string;
  eventName: string | Record<string, string>;
  kind: EventRetentionDeadlineKind;
  effectiveAt: string;
  status: EventRetentionDeadlineStatus;
  postponed: boolean;
}
