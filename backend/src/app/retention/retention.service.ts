import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import moment from 'moment';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import logger from '#core/logger';
import { AuditService } from '#app/audit/audit.service';
import { RegistrationService } from '#app/registration/registration.service';
import type { EventWithFreePlaces } from '#app/event/event.types';
import type {
  Event,
  EventRetentionDeadline,
} from '#generated/prisma/client.js';
import { getRequestContext } from '#core/context/requestContext';
import {
  extractPrivacyTags,
  isSpecialCategory,
} from '@camp-registration/common/form';
import {
  MAX_RETENTION_POSTPONE_MONTHS,
  EVENT_RETENTION_DEADLINE_KINDS,
  type PrivacyNoticeContent,
  type EventRetentionDeadlineKind,
  type RetentionPeriods,
  type RetentionPostponeData,
} from '@camp-registration/common/privacy';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import {
  promisedDeadlines,
  type ContentLookup,
  type NoticeStamp,
} from './retention.deadlines.js';

/** Events read per round trip by the daily sync. */
const SYNC_BATCH_SIZE = 50;

const NO_POSTPONEMENT = {
  postponedUntil: null,
  postponeReason: null,
  postponedAt: null,
  postponedById: null,
} as const;

/** What an event records about the deletion of its data. */
export type PurgeState = Pick<
  Event,
  'sensitiveDataPurgedAt' | 'registrationDataPurgedAt'
>;

export type RetentionEvent = PurgeState & Pick<Event, 'id' | 'endAt' | 'form'>;

export type DeadlineWithPostponer = EventRetentionDeadline & {
  postponedBy: { name: string } | null;
};

/** When a kind of the event's data was deleted for good, or null. */
export function purgedAt(
  event: PurgeState,
  kind: EventRetentionDeadlineKind,
): Date | null {
  // Sensitive data is a subset of the registration data.
  return kind === 'sensitive'
    ? (event.sensitiveDataPurgedAt ?? event.registrationDataPurgedAt)
    : event.registrationDataPurgedAt;
}

export function effectiveAt(deadline: EventRetentionDeadline): Date {
  return deadline.postponedUntil ?? deadline.dueAt;
}

/**
 * The retention workflow (docs/privacy.md, 8). Deadlines come from the notices
 * shown to the registrants; deleting is a manager's explicit action and is
 * never done automatically. What has to be kept beyond a deadline is the
 * organizer's judgment, recorded as a postponement.
 */
@injectable()
export class RetentionService extends BaseService {
  constructor(
    @inject(AuditService) private readonly audit: AuditService,
    @inject(PrivacyNoticeService)
    private readonly privacyNoticeService: PrivacyNoticeService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
  ) {
    super();
  }

  /** Brings the event's deadline rows in line with what was promised. */
  async syncEvent(event: RetentionEvent): Promise<void> {
    const promised = await this.promised(event);

    for (const kind of EVENT_RETENTION_DEADLINE_KINDS) {
      const dueAt = promised[kind];
      if (!dueAt) {
        // No longer promised (the form stopped asking, the registrations are
        // gone): a stale row would keep reminding. A deleted kind keeps its
        // row as the record of what was due.
        if (!purgedAt(event, kind)) {
          await this.prisma.eventRetentionDeadline.deleteMany({
            where: { eventId: event.id, kind },
          });
        }
        continue;
      }

      const existing = await this.prisma.eventRetentionDeadline.findUnique({
        where: { eventId_kind: { eventId: event.id, kind } },
      });
      if (!existing) {
        // Two syncs may race here (a page view and the daily job).
        await this.prisma.eventRetentionDeadline.createMany({
          data: [{ eventId: event.id, kind, dueAt }],
          skipDuplicates: true,
        });
        continue;
      }
      if (existing.dueAt.getTime() === dueAt.getTime()) {
        continue;
      }

      // A postponement the new promise reaches has nothing left to postpone.
      const overtaken =
        existing.postponedUntil !== null && existing.postponedUntil <= dueAt;
      const effective = overtaken ? dueAt : (existing.postponedUntil ?? dueAt);

      await this.prisma.eventRetentionDeadline.update({
        where: { id: existing.id },
        data: {
          dueAt,
          ...(overtaken ? NO_POSTPONEMENT : {}),
          // Reminders already sent stay sent unless the day they were for moved:
          // stages count days, so a shift within the day changes nothing.
          ...(utcDay(effective) !== utcDay(effectiveAt(existing))
            ? { notifiedStage: null }
            : {}),
        },
      });
    }
  }

  /**
   * Syncs every event that can have a deadline or still has a row, so a
   * reminder never goes out for a stale date or for registrations deleted
   * since. Opening an event's retention page syncs it too.
   */
  async syncAll(): Promise<void> {
    let cursor: string | undefined;
    let events;

    // In batches: the set only grows (nothing is deleted automatically) and
    // each event brings its whole form.
    do {
      events = await this.prisma.event.findMany({
        where: {
          registrationDataPurgedAt: null,
          OR: [
            {
              registrations: {
                some: { organizationPrivacyNoticeVersionId: { not: null } },
              },
            },
            { retentionDeadlines: { some: {} } },
          ],
          // By id, not a cursor row: that one may be deleted between batches.
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        select: {
          id: true,
          endAt: true,
          form: true,
          sensitiveDataPurgedAt: true,
          registrationDataPurgedAt: true,
        },
        orderBy: { id: 'asc' },
        take: SYNC_BATCH_SIZE,
      });

      for (const event of events) {
        try {
          await this.syncEvent(event);
        } catch (error: unknown) {
          // One event's broken notice must not stop the others.
          logger.error(`Failed to sync retention of event ${event.id}:`, error);
        }
      }
      cursor = events.at(-1)?.id;
    } while (events.length === SYNC_BATCH_SIZE);
  }

  async deadlines(eventId: string): Promise<DeadlineWithPostponer[]> {
    return this.prisma.eventRetentionDeadline.findMany({
      where: { eventId },
      include: { postponedBy: { select: { name: true } } },
      // Enum order: sensitive first, as it falls due first.
      orderBy: { kind: 'asc' },
    });
  }

  /** What the event's current notice states, for new registrations. */
  async currentPeriods(
    event: RetentionEvent & { organizationId: string },
  ): Promise<RetentionPeriods> {
    const notice = await this.privacyNoticeService.getComposedNotice(
      event.id,
      event.organizationId,
    );
    // Composition drops the retention of a free-text notice.
    const retention = notice?.retention;
    if (!retention || retention.months <= 0) {
      return { registrations: null, sensitive: null };
    }

    const special = retention.specialCategories;
    const main = { months: retention.months, anchor: retention.anchor };
    return {
      registrations: main,
      sensitive: !asksSensitive(event)
        ? null
        : special
          ? { weeks: special.weeks, anchor: special.anchor }
          : // Older notices: sensitive answers fall under the main period.
            main,
    };
  }

  async purgeState(eventId: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { sensitiveDataPurgedAt: true, registrationDataPurgedAt: true },
    });
  }

  /**
   * Marked as deleted, but the run that clears the answers never got to its
   * closing audit entry (interrupted, or refused after repeated conflicts).
   */
  async sensitivePurgeIncomplete(
    event: PurgeState & Pick<Event, 'id'>,
  ): Promise<boolean> {
    // Deleting everything covers it: that has its own incomplete state.
    if (!event.sensitiveDataPurgedAt || event.registrationDataPurgedAt) {
      return false;
    }

    const finished = await this.prisma.auditLog.count({
      where: {
        eventId: event.id,
        entityType: 'retention',
        action: 'sensitive_purged',
        createdAt: { gte: event.sensitiveDataPurgedAt },
      },
    });
    return finished === 0;
  }

  async registrationCount(eventId: string): Promise<number> {
    return this.prisma.registration.count({ where: { eventId } });
  }

  /**
   * Moves a deadline to a later date. The sensitive one never passes the
   * general one: it is a subset of that data.
   */
  async postpone(
    event: RetentionEvent,
    kind: EventRetentionDeadlineKind,
    data: RetentionPostponeData,
  ): Promise<void> {
    if (purgedAt(event, kind)) {
      throw new ApiError(httpStatus.CONFLICT, 'This data was already deleted.');
    }

    const deadlines = await this.prisma.eventRetentionDeadline.findMany({
      where: { eventId: event.id },
    });
    const deadline = deadlines.find((entry) => entry.kind === kind);
    if (!deadline) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No such retention deadline.');
    }

    const until = moment.utc(data.until, 'YYYY-MM-DD', true);
    const today = moment.utc().startOf('day');
    if (
      !until.isValid() ||
      !until.isAfter(today) ||
      until.isAfter(today.clone().add(MAX_RETENTION_POSTPONE_MONTHS, 'months'))
    ) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        `The new date must lie within the next ${MAX_RETENTION_POSTPONE_MONTHS.toString()} months.`,
      );
    }
    // Later only: an earlier date would shorten what was promised, and the next
    // sync would discard it as overtaken.
    if (!until.isAfter(effectiveAt(deadline))) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        'The new date must lie after the current deadline.',
      );
    }
    assertOrdered(event, kind, until.toDate(), deadlines);

    await this.transaction(async (tx) => {
      await tx.eventRetentionDeadline.update({
        where: { id: deadline.id },
        data: {
          postponedUntil: until.toDate(),
          postponeReason: data.reason,
          postponedAt: new Date(),
          postponedById: this.actorId(),
          notifiedStage: null,
        },
      });

      // The reason may name a person or a case, so only the date is logged.
      await this.audit.record({
        action: 'postponed',
        entityType: 'retention',
        entityId: deadline.id,
        eventId: event.id,
        details: {
          context: { kind },
          values: { postponedUntil: data.until },
        },
      });
    });
  }

  /**
   * Clears the answers to special-category questions in every registration
   * and detaches files uploaded to them (the file cleanup removes those).
   * Idempotent: a rerun finds nothing left to clear.
   */
  async purgeSensitiveData(event: EventWithFreePlaces): Promise<number> {
    if (event.registrationDataPurgedAt) {
      return 0;
    }

    // Marked first: from here on the event takes no registrations, and no
    // edit can bring sensitive answers back while the loop runs.
    await this.markPurged(event, ['sensitive']);
    const cleared = await this.registrationService.clearSensitiveAnswers(event);

    await this.audit.record({
      action: 'sensitive_purged',
      entityType: 'retention',
      entityId: event.id,
      eventId: event.id,
      details: { values: { count: cleared } },
    });

    return cleared;
  }

  /**
   * Deletes every registration of the event. Bed assignments, files and audit
   * entries are only detached; nothing financial points at a registration.
   * The event never takes registrations again. Idempotent.
   */
  async purgeRegistrationData(
    event: PurgeState & Pick<Event, 'id'>,
  ): Promise<number> {
    // Sensitive data is a subset: deleting all of it deletes that too.
    await this.markPurged(event, ['sensitive', 'registrations']);

    const deleted = await this.registrationService.deleteRegistrationsForEvent(
      event.id,
    );

    await this.audit.record({
      action: 'registrations_purged',
      entityType: 'retention',
      entityId: event.id,
      eventId: event.id,
      details: { values: { count: deleted } },
    });

    return deleted;
  }

  /**
   * Records the deletion for good, before any data is touched. The event's
   * registration status reads it and stays closed from then on
   * (`eventRegistrationStatus`); the window itself is left as it was.
   */
  private async markPurged(
    event: PurgeState & Pick<Event, 'id'>,
    kinds: EventRetentionDeadlineKind[],
  ): Promise<void> {
    // Whole seconds, as the columns store them: MySQL would round up past the
    // closing audit entry, and the deletion would read as incomplete.
    const now = new Date(Math.floor(Date.now() / 1000) * 1000);

    await this.prisma.event.update({
      where: { id: event.id },
      data: {
        ...(kinds.includes('sensitive')
          ? { sensitiveDataPurgedAt: event.sensitiveDataPurgedAt ?? now }
          : {}),
        ...(kinds.includes('registrations')
          ? { registrationDataPurgedAt: event.registrationDataPurgedAt ?? now }
          : {}),
      },
    });
    // A reason may name a person or a case; once the data is gone, so is it.
    await this.prisma.eventRetentionDeadline.updateMany({
      where: { eventId: event.id, kind: { in: kinds } },
      data: { postponeReason: null },
    });
  }

  /**
   * Open deadlines of the organization's events, for its overview: dates and
   * kinds only, never registration data.
   */
  async openDeadlines(organizationId: string) {
    const deadlines = await this.prisma.eventRetentionDeadline.findMany({
      where: { event: { registrationDataPurgedAt: null, organizationId } },
      include: {
        postponedBy: { select: { name: true } },
        event: {
          select: {
            id: true,
            name: true,
            sensitiveDataPurgedAt: true,
            registrationDataPurgedAt: true,
          },
        },
      },
    });

    return deadlines
      .filter((deadline) => !purgedAt(deadline.event, deadline.kind))
      .sort((a, b) => effectiveAt(a).getTime() - effectiveAt(b).getTime());
  }

  private async promised(event: RetentionEvent) {
    const stamps = await this.prisma.registration.groupBy({
      by: ['organizationPrivacyNoticeVersionId', 'eventPrivacyNoticeVersionId'],
      where: {
        eventId: event.id,
        organizationPrivacyNoticeVersionId: { not: null },
      },
      _min: { createdAt: true },
    });

    const promised = promisedDeadlines(
      stamps,
      await this.stampedContent(stamps),
      event.endAt,
    );

    return {
      registrations: promised.registrations,
      // Never later than the general deadline: it is a subset of that data.
      sensitive:
        asksSensitive(event) && promised.sensitive
          ? earlier(promised.sensitive, promised.registrations)
          : null,
    } satisfies Record<EventRetentionDeadlineKind, Date | null>;
  }

  /** Resolves every stamped version in one query, as a lookup by id. */
  private async stampedContent(stamps: NoticeStamp[]): Promise<ContentLookup> {
    const ids = stamps
      .flatMap((stamp) => [
        stamp.organizationPrivacyNoticeVersionId,
        stamp.eventPrivacyNoticeVersionId,
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

  private actorId(): string | null {
    return getRequestContext()?.userId ?? null;
  }
}

/** A form without special-category questions holds no sensitive data. */
function asksSensitive(event: Pick<Event, 'form'>): boolean {
  return extractPrivacyTags(event.form).tagged.some((tag) =>
    isSpecialCategory(tag.category),
  );
}

/** The UTC calendar day of a date, as the reminder stages count days. */
function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Sensitive deadline ≤ general deadline, also after postponing either. */
function assertOrdered(
  event: PurgeState,
  kind: EventRetentionDeadlineKind,
  until: Date,
  deadlines: EventRetentionDeadline[],
): void {
  const other = deadlines.find((entry) => entry.kind !== kind);
  if (!other || purgedAt(event, other.kind)) {
    return;
  }

  const otherAt = effectiveAt(other);
  const outOfOrder = kind === 'sensitive' ? until > otherAt : until < otherAt;

  if (outOfOrder) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      'The sensitive data deadline must not lie after the registration data deadline.',
    );
  }
}

function earlier(date: Date, bound: Date | null): Date {
  return bound && bound < date ? bound : date;
}
