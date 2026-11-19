import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import moment from 'moment';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import logger from '#core/logger';
import { AuditService } from '#app/audit/audit.service';
import { RegistrationForm } from '#app/registration/registration.form';
import type { EventWithFreePlaces } from '#app/event/event.types';
import type { Event, RetentionDeadline } from '#generated/prisma/client.js';
import { getRequestContext } from '#core/context/requestContext';
import {
  extractPrivacyTags,
  isSpecialCategory,
} from '@camp-registration/common/form';
import {
  MAX_RETENTION_POSTPONE_MONTHS,
  RETENTION_DEADLINE_KINDS,
  RETENTION_REMINDER_STAGES,
  type PrivacyNoticeContent,
  type RetentionDeadlineKind,
  type RetentionPeriods,
  type RetentionPostponeData,
} from '@camp-registration/common/privacy';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import {
  promisedDeadlines,
  type ContentLookup,
  type NoticeStamp,
} from './retention.deadlines.js';

/** Registrations handled per database round trip by the deletion actions. */
const BATCH_SIZE = 100;

/** Days of new registrations or edits after which the daily job re-syncs. */
const SYNC_LOOKBACK_DAYS = 7;

const NO_POSTPONEMENT = {
  postponedUntil: null,
  postponeReason: null,
  postponedAt: null,
  postponedById: null,
} as const;

export type RetentionEvent = Pick<
  Event,
  'id' | 'endAt' | 'form' | 'sensitiveDataPurgedAt' | 'registrationDataPurgedAt'
>;

export type DeadlineWithPostponer = RetentionDeadline & {
  postponedBy: { name: string } | null;
};

/** When a kind of the event's data was deleted for good, or null. */
export function purgedAt(
  event: Pick<Event, 'sensitiveDataPurgedAt' | 'registrationDataPurgedAt'>,
  kind: RetentionDeadlineKind,
): Date | null {
  // Sensitive data is a subset of the registration data.
  return kind === 'sensitive'
    ? (event.sensitiveDataPurgedAt ?? event.registrationDataPurgedAt)
    : event.registrationDataPurgedAt;
}

export function effectiveAt(deadline: RetentionDeadline): Date {
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
  ) {
    super();
  }

  /** Brings the event's deadline rows in line with what was promised. */
  async syncEvent(event: RetentionEvent): Promise<void> {
    const promised = await this.promised(event);

    for (const kind of RETENTION_DEADLINE_KINDS) {
      const dueAt = promised[kind];
      if (!dueAt) {
        continue;
      }

      const existing = await this.prisma.retentionDeadline.findUnique({
        where: { eventId_kind: { eventId: event.id, kind } },
      });
      if (!existing) {
        // Two syncs may race here (a page view and the daily job).
        await this.prisma.retentionDeadline.createMany({
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

      await this.prisma.retentionDeadline.update({
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
   * Syncs the events whose promise can have changed since the last run (new
   * registrations, edits to end date or form) and those about to be reminded,
   * so a reminder never goes out for a stale date. Existing events got their
   * deadlines from the deploy's backfill; opening an event's retention page
   * syncs it too.
   */
  async syncAll(now: Date = new Date()): Promise<void> {
    const since = moment(now).subtract(SYNC_LOOKBACK_DAYS, 'days').toDate();
    const horizon = moment(now)
      .add(Math.max(...RETENTION_REMINDER_STAGES), 'days')
      .toDate();

    const events = await this.prisma.event.findMany({
      where: {
        registrationDataPurgedAt: null,
        registrations: {
          some: { organizationPrivacyNoticeVersionId: { not: null } },
        },
        OR: [
          { registrations: { some: { createdAt: { gte: since } } } },
          { updatedAt: { gte: since } },
          { retentionDeadlines: { some: { dueAt: { lte: horizon } } } },
          {
            retentionDeadlines: { some: { postponedUntil: { lte: horizon } } },
          },
        ],
      },
      select: {
        id: true,
        endAt: true,
        form: true,
        sensitiveDataPurgedAt: true,
        registrationDataPurgedAt: true,
      },
    });

    for (const event of events) {
      try {
        await this.syncEvent(event);
      } catch (error: unknown) {
        // One event's broken notice must not stop the others.
        logger.error(`Failed to sync retention of event ${event.id}:`, error);
      }
    }
  }

  async deadlines(eventId: string): Promise<DeadlineWithPostponer[]> {
    const deadlines = await this.prisma.retentionDeadline.findMany({
      where: { eventId },
      include: { postponedBy: { select: { name: true } } },
    });

    return RETENTION_DEADLINE_KINDS.flatMap((kind) =>
      deadlines.filter((deadline) => deadline.kind === kind),
    );
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

  async registrationCount(eventId: string): Promise<number> {
    return this.prisma.registration.count({ where: { eventId } });
  }

  /**
   * Moves a deadline to a new date. The sensitive deadline never lies after
   * the general one: sensitive data is a subset of the registration data.
   */
  async postpone(
    event: RetentionEvent,
    kind: RetentionDeadlineKind,
    data: RetentionPostponeData,
  ): Promise<void> {
    if (purgedAt(event, kind)) {
      throw new ApiError(httpStatus.CONFLICT, 'This data was already deleted.');
    }

    const deadlines = await this.prisma.retentionDeadline.findMany({
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
    assertOrdered(event, kind, until.toDate(), deadlines);

    await this.transaction(async (tx) => {
      await tx.retentionDeadline.update({
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

    // Marked and closed first: from here on no registration, public or by a
    // manager, can bring sensitive answers back while the loop runs.
    const closing = await this.markPurged(event, ['sensitive']);

    let cleared = 0;
    let cursor: string | undefined;

    for (;;) {
      const registrations = await this.prisma.registration.findMany({
        where: { eventId: event.id },
        select: { id: true, data: true, locale: true, group: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (registrations.length === 0) {
        break;
      }
      cursor = registrations.at(-1)?.id;

      for (const registration of registrations) {
        const form = new RegistrationForm(event, {
          locale: registration.locale,
          group: registration.group,
        }).load(registration.data);
        const filesBefore = form.getFileIds();
        const data = form.withoutSensitiveAnswers();
        const filesAfter = new Set(form.getFileIds());

        if (JSON.stringify(data) === JSON.stringify(registration.data)) {
          continue;
        }

        const removedFiles = filesBefore.filter((id) => !filesAfter.has(id));
        await this.transaction(async (tx) => {
          await tx.registration.update({
            where: { id: registration.id },
            data: { data },
          });
          if (removedFiles.length > 0) {
            await tx.file.updateMany({
              where: {
                id: { in: removedFiles },
                registrationId: registration.id,
              },
              data: { registrationId: null },
            });
          }
        });
        cleared++;
      }
    }

    await this.audit.record({
      action: 'sensitive_purged',
      entityType: 'retention',
      entityId: event.id,
      eventId: event.id,
      details: { values: { count: cleared, registrationClosed: closing } },
    });

    return cleared;
  }

  /**
   * Deletes every registration of the event. Bed assignments, files and audit
   * entries are only detached; nothing financial points at a registration.
   * The event never takes registrations again. Idempotent.
   */
  async purgeRegistrationData(
    event: Pick<
      Event,
      | 'id'
      | 'sensitiveDataPurgedAt'
      | 'registrationDataPurgedAt'
      | 'registrationClosesAt'
    >,
  ): Promise<number> {
    // Sensitive data is a subset: deleting all of it deletes that too.
    const closing = await this.markPurged(event, [
      'sensitive',
      'registrations',
    ]);

    let deleted = 0;
    for (;;) {
      const batch = await this.prisma.registration.findMany({
        where: { eventId: event.id },
        select: { id: true },
        take: BATCH_SIZE,
      });
      if (batch.length === 0) {
        break;
      }

      const result = await this.prisma.registration.deleteMany({
        where: { id: { in: batch.map(({ id }) => id) } },
      });
      deleted += result.count;
    }

    await this.audit.record({
      action: 'registrations_purged',
      entityType: 'retention',
      entityId: event.id,
      eventId: event.id,
      details: { values: { count: deleted, registrationClosed: closing } },
    });

    return deleted;
  }

  /**
   * Records the deletion for good and ends an open or scheduled registration
   * window, before any data is touched. Returns whether the window was closed.
   */
  private async markPurged(
    event: Pick<
      Event,
      | 'id'
      | 'sensitiveDataPurgedAt'
      | 'registrationDataPurgedAt'
      | 'registrationClosesAt'
    >,
    kinds: RetentionDeadlineKind[],
  ): Promise<boolean> {
    const now = new Date();
    const closing = closeRegistration(event, now);

    await this.prisma.event.update({
      where: { id: event.id },
      data: {
        ...(kinds.includes('sensitive')
          ? { sensitiveDataPurgedAt: event.sensitiveDataPurgedAt ?? now }
          : {}),
        ...(kinds.includes('registrations')
          ? { registrationDataPurgedAt: event.registrationDataPurgedAt ?? now }
          : {}),
        ...closing,
      },
    });

    return !!closing.registrationClosesAt;
  }

  /**
   * Open deadlines across events, for the organization and platform
   * overviews: dates and kinds only, never registration data.
   */
  async openDeadlines(organizationId?: string) {
    const deadlines = await this.prisma.retentionDeadline.findMany({
      where: {
        event: {
          registrationDataPurgedAt: null,
          ...(organizationId ? { organizationId } : {}),
        },
      },
      include: {
        postponedBy: { select: { name: true } },
        event: {
          select: {
            id: true,
            name: true,
            organizationId: true,
            sensitiveDataPurgedAt: true,
            registrationDataPurgedAt: true,
            organization: { select: { name: true } },
          },
        },
      },
    });

    return deadlines
      .filter(
        (deadline) =>
          !purgedAt(deadline.event, deadline.kind as RetentionDeadlineKind),
      )
      .sort((a, b) => effectiveAt(a).getTime() - effectiveAt(b).getTime());
  }

  private async promised(event: RetentionEvent) {
    const stamps = await this.prisma.registration.groupBy({
      by: ['organizationPrivacyNoticeVersionId', 'eventPrivacyNoticeVersionId'],
      where: {
        eventId: event.id,
        organizationPrivacyNoticeVersionId: { not: null },
      },
      _max: { createdAt: true },
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
    } satisfies Record<RetentionDeadlineKind, Date | null>;
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

/**
 * Ends an open or scheduled registration window now: after a deletion the
 * event takes no registrations again, and its window should say so too.
 */
function closeRegistration(
  event: Pick<Event, 'registrationClosesAt'>,
  now: Date,
): { registrationClosesAt?: Date } {
  return event.registrationClosesAt && event.registrationClosesAt <= now
    ? {}
    : { registrationClosesAt: now };
}

/** The UTC calendar day of a date, as the reminder stages count days. */
function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function earlier(date: Date, bound: Date | null): Date {
  return bound && bound < date ? bound : date;
}

/** Sensitive deadline ≤ general deadline, also after postponing either. */
function assertOrdered(
  event: RetentionEvent,
  kind: RetentionDeadlineKind,
  until: Date,
  deadlines: RetentionDeadline[],
): void {
  const other = deadlines.find((entry) => entry.kind !== kind);
  if (!other || purgedAt(event, other.kind as RetentionDeadlineKind)) {
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
