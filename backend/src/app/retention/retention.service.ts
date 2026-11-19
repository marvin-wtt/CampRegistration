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
      if (existing?.dueAt.getTime() === dueAt.getTime()) {
        continue;
      }

      await this.prisma.retentionDeadline.upsert({
        where: { eventId_kind: { eventId: event.id, kind } },
        create: { eventId: event.id, kind, dueAt },
        // A new date makes the reminders already sent stale.
        update: { dueAt, notifiedStage: null },
      });
    }
  }

  /** Syncs every event that has stamped registrations or open deadlines. */
  async syncAll(): Promise<void> {
    const events = await this.prisma.event.findMany({
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
    const retention = notice?.retention;
    if (!retention || retention.months <= 0) {
      return { registrations: null, sensitive: null };
    }

    const special = retention.specialCategories;
    return {
      registrations: { months: retention.months, anchor: retention.anchor },
      sensitive: !asksSensitive(event)
        ? null
        : special
          ? { weeks: special.weeks, anchor: special.anchor }
          : // Older notices: sensitive answers fall under the main period.
            { weeks: retention.months * 4, anchor: retention.anchor },
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

    await this.transaction(async (tx) => {
      await tx.event.update({
        where: { id: event.id },
        data: {
          sensitiveDataPurgedAt: event.sensitiveDataPurgedAt ?? new Date(),
        },
      });
      await this.audit.record({
        action: 'sensitive_purged',
        entityType: 'retention',
        entityId: event.id,
        eventId: event.id,
        details: { values: { count: cleared } },
      });
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
      'id' | 'sensitiveDataPurgedAt' | 'registrationDataPurgedAt'
    >,
  ): Promise<number> {
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

    const now = new Date();
    await this.transaction(async (tx) => {
      await tx.event.update({
        where: { id: event.id },
        data: {
          // Sensitive data is a subset: deleting all of it deletes that too.
          sensitiveDataPurgedAt: event.sensitiveDataPurgedAt ?? now,
          registrationDataPurgedAt: event.registrationDataPurgedAt ?? now,
        },
      });
      await this.audit.record({
        action: 'registrations_purged',
        entityType: 'retention',
        entityId: event.id,
        eventId: event.id,
        details: { values: { count: deleted } },
      });
    });

    return deleted;
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
