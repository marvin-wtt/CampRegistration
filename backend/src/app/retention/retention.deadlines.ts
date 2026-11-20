import moment from 'moment';
import {
  composePrivacyNotice,
  RETENTION_REMINDER_STAGES,
  type PrivacyNoticeContent,
  type RetentionAnchor,
} from '@camp-registration/common/privacy';

/**
 * One pair of notice versions an event's registrations were stamped with, and
 * the first registration that pair covers: the earliest promise it made.
 */
export interface NoticeStamp {
  organizationPrivacyNoticeVersionId: string | null;
  eventPrivacyNoticeVersionId: string | null;
  _min: { createdAt: Date | null };
}

/** Looks a stamped version's content up by id. */
export type ContentLookup = (id: string | null) => PrivacyNoticeContent | null;

/** The earliest date each kind of data was promised to be deleted by. */
export interface PromisedDeadlines {
  registrations: Date | null;
  sensitive: Date | null;
}

/**
 * What the notices shown to an event's registrants promised.
 *
 * Read from the stamped versions, not today's notice: a period is a promise
 * made to a person at a particular moment, and a later, longer period has not
 * lengthened it. One deadline per kind covers all registrants, so the earliest
 * promise wins: deleting early is allowed, keeping longer than promised is not.
 */
export function promisedDeadlines(
  stamps: NoticeStamp[],
  contentOf: ContentLookup,
  eventEndAt: Date,
): PromisedDeadlines {
  const result: PromisedDeadlines = { registrations: null, sensitive: null };

  for (const stamp of stamps) {
    // Composition drops the retention of a free-text notice: no date.
    const { retention } = composePrivacyNotice(
      contentOf(stamp.organizationPrivacyNoticeVersionId),
      contentOf(stamp.eventPrivacyNoticeVersionId),
    );
    if (!retention || retention.months <= 0) {
      continue;
    }

    const firstRegisteredAt = stamp._min.createdAt ?? eventEndAt;
    // In UTC, so the date does not depend on the server's time zone.
    const from = (anchor: RetentionAnchor) =>
      moment.utc(anchor === 'event_end' ? eventEndAt : firstRegisteredAt);

    const registrations = from(retention.anchor)
      .add(retention.months, 'months')
      .toDate();
    result.registrations = earliest(result.registrations, registrations);

    // Notices published before the sensitive period existed promised nothing
    // shorter, so their sensitive answers fall under the main period.
    const special = retention.specialCategories;
    const sensitive = special
      ? from(special.anchor).add(special.weeks, 'weeks').toDate()
      : registrations;
    result.sensitive = earliest(result.sensitive, sensitive);
  }

  return result;
}

function earliest(current: Date | null, candidate: Date): Date {
  // Whole seconds, as the column stores them: a stored date then compares
  // equal to a recomputed one, and an unchanged promise stays unchanged.
  const rounded = new Date(Math.floor(candidate.getTime() / 1000) * 1000);
  return current && current < rounded ? current : rounded;
}

/** Whole UTC days from `now` to the deadline; negative once it passed. */
export function daysUntil(deadline: Date, now: Date): number {
  return moment
    .utc(deadline)
    .startOf('day')
    .diff(moment.utc(now).startOf('day'), 'days');
}

/** The most urgent reminder stage reached, or null while further away. */
export function reminderStage(deadline: Date, now: Date): number | null {
  const daysLeft = daysUntil(deadline, now);
  const reached = RETENTION_REMINDER_STAGES.filter(
    (stage) => daysLeft <= stage,
  );

  return reached.length > 0 ? Math.min(...reached) : null;
}
