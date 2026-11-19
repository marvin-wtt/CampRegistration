import moment from 'moment';
import {
  composePrivacyNotice,
  type PrivacyNoticeContent,
  type RetentionAnchor,
} from '@camp-registration/common/privacy';

/**
 * One pair of notice versions an event's registrations were stamped with, and
 * the last registration that pair covers.
 */
export interface NoticeStamp {
  organizationPrivacyNoticeVersionId: string | null;
  eventPrivacyNoticeVersionId: string | null;
  _max: { createdAt: Date | null };
}

/** Looks a stamped version's content up by id. */
export type ContentLookup = (id: string | null) => PrivacyNoticeContent | null;

/** The latest date each kind of data was promised to be kept until. */
export interface PromisedDeadlines {
  registrations: Date | null;
  sensitive: Date | null;
}

/**
 * What the notices shown to an event's registrants promised.
 *
 * Read from the stamped versions, not today's notice: a period is a promise
 * made to a person at a particular moment, and a later, longer period has not
 * lengthened it. The latest promise per kind wins, since one deadline per kind
 * covers all registrants.
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

    const lastRegisteredAt = stamp._max.createdAt ?? eventEndAt;
    // In UTC, so the date does not depend on the server's time zone.
    const from = (anchor: RetentionAnchor) =>
      moment.utc(anchor === 'event_end' ? eventEndAt : lastRegisteredAt);

    const registrations = from(retention.anchor)
      .add(retention.months, 'months')
      .toDate();
    result.registrations = later(result.registrations, registrations);

    // Notices published before the sensitive period existed promised nothing
    // shorter, so their sensitive answers fall under the main period.
    const special = retention.specialCategories;
    const sensitive = special
      ? from(special.anchor).add(special.weeks, 'weeks').toDate()
      : registrations;
    result.sensitive = later(result.sensitive, sensitive);
  }

  return result;
}

function later(current: Date | null, candidate: Date): Date {
  // Whole seconds, as the column stores them: a stored date then compares
  // equal to a recomputed one, and an unchanged promise stays unchanged.
  const rounded = new Date(Math.floor(candidate.getTime() / 1000) * 1000);
  return current && current > rounded ? current : rounded;
}
