import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import logger from '#core/logger';
import {
  composePrivacyNotice,
  isConsentBoundException,
  retentionExceptions,
  type PrivacyNoticeContent,
  type PrivacyRetention,
} from '@camp-registration/common/privacy';
import type { Prisma } from '#generated/prisma/client.js';
import { CampRetentionDueMessage } from './privacy-notice.messages.js';
import moment from 'moment';

/**
 * How long before the promised period lapses the managers hear about it. Long
 * enough to schedule the review of a camp's registrations into a normal week,
 * short enough that the mail still reads as being about this camp rather than
 * about camps in general.
 */
const REMINDER_LEAD_DAYS = 14;

/**
 * Camps looked at per run. The job runs daily and the flag is set as each camp
 * is handled, so a backlog drains over consecutive days instead of turning one
 * run into an unbounded scan.
 */
const BATCH_SIZE = 200;

/** What one camp's registrants were promised, and when that runs out. */
interface RetentionDeadline {
  dueAt: Date;
  months: number;
  anchor: PrivacyRetention['anchor'];
  hasExceptions: boolean;
  hasConsentBoundData: boolean;
}

/**
 * One pair of notice versions a camp's registrations were stamped with, and the
 * last registration that pair covers.
 */
interface NoticeStamp {
  organizationPrivacyNoticeVersionId: string | null;
  campPrivacyNoticeVersionId: string | null;
  _max: { createdAt: Date | null };
}

/** Looks a stamped version's content up by id. */
type ContentLookup = (id: string | null) => PrivacyNoticeContent | null;

/**
 * Reminds the people who can act on a camp that the retention period their
 * organization published is running out.
 *
 * It deliberately deletes nothing. What may go and what must stay is a judgment
 * about live obligations — an unpaid invoice, an open insurance claim, a
 * safeguarding matter — that the platform cannot make on a controller's behalf,
 * and getting it wrong destroys evidence irreversibly. Art. 5(1)(e) is the
 * controller's duty; this makes it impossible to miss the date.
 */
@injectable()
export class PrivacyRetentionService extends BaseService {
  async sendDueRetentionReminders(): Promise<void> {
    const horizon = moment().add(REMINDER_LEAD_DAYS, 'days').toDate();

    const camps = await this.prisma.camp.findMany({
      where: {
        retentionReminderSentAt: null,
        // Nothing to review until the camp is over.
        endAt: { lt: new Date() },
        // Only send for camps with an existing privacy version.
        // This excludes camps created before this feature was added
        registrations: {
          some: { organizationPrivacyNoticeVersionId: { not: null } },
        },
      },
      // Only what the reminder needs: the deadline comes from the notices
      // stamped on the registrations, not from the camp's current owner.
      select: { id: true, name: true, endAt: true },
      orderBy: { endAt: 'asc' },
      take: BATCH_SIZE,
    });

    for (const camp of camps) {
      try {
        const deadline = await this.retentionDeadline(camp.id, camp.endAt);

        if (deadline && deadline.dueAt <= horizon) {
          await this.remind(camp, deadline);
        }
      } catch (error: unknown) {
        // One camp's broken notice must not stop the rest of the batch: the
        // others are on a deadline of their own.
        logger.error(
          `Failed to send the retention reminder for camp ${camp.id}:`,
          error,
        );
      }
    }
  }

  /**
   * When the last of a camp's registrants stops being covered by the period
   * they were shown.
   *
   * The deadline comes from the notice versions actually stamped on the
   * registrations, not from what the organization publishes today. A period is
   * a promise made to a particular person at a particular moment, and an
   * organization that later lengthens it has not lengthened what it told the
   * people who already registered — reading today's notice would let exactly
   * that edit push the reminder past the date it exists to catch.
   *
   * Grouping by the stamped pair keeps that precise for the price of one row
   * per distinct pair, which for almost every camp is a single row: only the
   * last registration under a given pair can set that pair's deadline.
   *
   * The *latest* of those deadlines wins, because the reminder is sent once.
   * Firing on the earliest would put the mail in front of a manager who mostly
   * cannot act yet, with no second mail when the rest came due.
   */
  private async retentionDeadline(
    campId: string,
    campEndAt: Date,
  ): Promise<RetentionDeadline | null> {
    const stamps = await this.prisma.registration.groupBy({
      by: ['organizationPrivacyNoticeVersionId', 'campPrivacyNoticeVersionId'],
      where: { campId, organizationPrivacyNoticeVersionId: { not: null } },
      _max: { createdAt: true },
    });

    const contentOf = await this.stampedContent(stamps);

    return stamps
      .map((stamp) => this.deadlineFor(stamp, contentOf, campEndAt))
      .reduce<RetentionDeadline | null>(
        (latest, deadline) =>
          deadline && (!latest || deadline.dueAt > latest.dueAt)
            ? deadline
            : latest,
        null,
      );
  }

  /** The deadline one stamped pair carries, or null if it promised no period. */
  private deadlineFor(
    stamp: NoticeStamp,
    contentOf: ContentLookup,
    campEndAt: Date,
  ): RetentionDeadline | null {
    const { retention } = composePrivacyNotice(
      contentOf(stamp.organizationPrivacyNoticeVersionId ?? null),
      contentOf(stamp.campPrivacyNoticeVersionId),
    );

    // A notice may leave the period out — free-text mode carries no structure
    // at all — and a period nobody stated is not one this can put a date on.
    if (!retention || retention.months <= 0) {
      return null;
    }

    const anchoredAt =
      retention.anchor === 'camp_end'
        ? campEndAt
        : (stamp._max.createdAt ?? campEndAt);

    const exceptions = retentionExceptions(retention);

    return {
      dueAt: moment(anchoredAt).add(retention.months, 'months').toDate(),
      months: retention.months,
      anchor: retention.anchor,
      hasExceptions: exceptions.length > 0,
      hasConsentBoundData: exceptions.some(isConsentBoundException),
    };
  }

  /** Resolves every stamped version in one query, as a lookup by id. */
  private async stampedContent(stamps: NoticeStamp[]): Promise<ContentLookup> {
    const ids = stamps
      .flatMap((stamp) => [
        stamp.organizationPrivacyNoticeVersionId,
        stamp.campPrivacyNoticeVersionId,
      ])
      .filter((id) => id !== null);

    const versions = await this.prisma.privacyNoticeVersion.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: { id: true, content: true },
    });

    const byId = new Map<string, PrivacyNoticeContent>(
      versions.map(({ id, content }) => [id, content]),
    );

    return (id) => (id ? (byId.get(id) ?? null) : null);
  }

  /**
   * Marks the camp before enqueuing. A reminder that was sent twice is worse
   * than one that was lost: the mail is a prompt to review the camp by hand,
   * and the flag is the only record that the prompt has already gone out.
   */
  private async remind(
    camp: { id: string; name: Prisma.JsonValue },
    deadline: RetentionDeadline,
  ): Promise<void> {
    const recipients = await this.recipients(camp.id);

    if (recipients.length === 0) {
      // Nobody on this camp can act on the reminder. Marking it anyway would
      // spend the one notification on an empty room, so it is left for the day
      // a director is appointed.
      logger.warn(
        `Camp ${camp.id} has no director; retention reminder withheld.`,
      );
      return;
    }

    await this.prisma.camp.update({
      where: { id: camp.id },
      data: { retentionReminderSentAt: new Date() },
    });

    await CampRetentionDueMessage.enqueueBulk(
      recipients.map((recipient) => ({
        camp: { id: camp.id, name: camp.name },
        recipient,
        dueAt: deadline.dueAt.toISOString(),
        months: deadline.months,
        anchor: deadline.anchor,
        hasExceptions: deadline.hasExceptions,
        hasConsentBoundData: deadline.hasConsentBoundData,
      })),
    );
  }

  /**
   * The directors of the camp. They are the ones who both may delete it and
   * answer for the data it holds; a coordinator can edit the camp but is not
   * the person a retention deadline is addressed to, and mailing the whole
   * management team turns a decision into a diffusion of responsibility.
   *
   * Organization administrators are deliberately not included either: they
   * hold `ORGANIZATION_CAMP_PERMISSIONS`, which stops well short of
   * `camp.delete`, and telling someone to delete data they cannot reach is not
   * a reminder.
   */
  private async recipients(campId: string) {
    const managers = await this.prisma.campManager.findMany({
      where: {
        campId,
        role: 'DIRECTOR',
        // An invitation nobody has accepted has no account behind it and no
        // way to open the camp.
        userId: { not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        user: { select: { name: true, email: true, locale: true } },
      },
    });

    return managers
      .map((manager) => manager.user)
      .filter((user) => user !== null);
  }
}
