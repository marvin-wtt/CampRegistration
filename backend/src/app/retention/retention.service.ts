import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import { AuditService } from '#app/audit/audit.service';
import { RegistrationService } from '#app/registration/registration.service';
import { EventService } from '#app/event/event.service';
import { eventRegistrationStatus } from '#app/event/event.util';
import { PrivacyNoticeService } from '#app/privacyNotice/privacy-notice.service';
import type { EventWithFreePlaces } from '#app/event/event.types';
import type {
  Event,
  EventRetentionState,
  Prisma,
} from '#generated/prisma/client.js';
import { getRequestContext } from '#core/context/requestContext';
import { batchesById } from '#core/database/batches';
import {
  extractPrivacyTags,
  isSpecialCategory,
} from '@camp-registration/common/form';
import {
  composePrivacyNotice,
  EVENT_RETENTION_DEADLINE_KINDS,
  type EventRetentionDeadlineKind,
  type EventRetentionDeadlineStatus,
  type PrivacyNoticeContent,
  type RetentionPeriods,
  type RetentionPostponeData,
} from '@camp-registration/common/privacy';
import {
  currentDateInTimeZone,
  utcCarrierToNaiveDateTime,
  zonedInstant,
} from '@camp-registration/common/utils';
import {
  deadlineStatus,
  effectiveDeadlines,
  postponeRange,
  promisedDeadlines,
  retentionPeriods,
  type DeadlineDates,
} from './retention.deadlines.js';

/** Events read per round trip when walking all of them. */
const BATCH_SIZE = 50;

/** How long deleting all registrations of an event may hold its transaction. */
const PURGE_TIMEOUT_MS = 60_000;

/** What an event records about the deletion of its data. */
export type PurgeState = Pick<
  Event,
  | 'sensitiveDataPurgedAt'
  | 'sensitiveDataClearedAt'
  | 'registrationDataPurgedAt'
>;

export type RetentionEvent = PurgeState &
  Pick<Event, 'id' | 'endAt' | 'timezone' | 'form'>;

export type RetentionState = EventRetentionState & {
  postponedBy: { name: string } | null;
};

/** A deadline whose data is not deleted yet, as of today. */
export interface Deadline {
  kind: EventRetentionDeadlineKind;
  dueAt: string;
  effectiveAt: string;
  status: EventRetentionDeadlineStatus;
  postponeRange: { min: string; max: string } | null;
  /** Its postponement and the reminders sent, once there was either. */
  state: RetentionState | null;
}

/**
 * When a kind of the event's data was deleted for good, or null. Sensitive
 * data counts only once every registration was cleared, so an interrupted
 * deletion stays open and is run again.
 */
export function purgedAt(
  event: PurgeState,
  kind: EventRetentionDeadlineKind,
): Date | null {
  return kind === 'sensitive'
    ? (event.sensitiveDataClearedAt ?? event.registrationDataPurgedAt)
    : event.registrationDataPurgedAt;
}

/**
 * The retention workflow (docs/privacy.md, 8). Deadlines are computed from the
 * notices shown to the registrants whenever they are needed; deleting is a
 * manager's explicit action and is never done automatically. What has to be
 * kept beyond a deadline is the organizer's judgment, recorded as a
 * postponement.
 */
@injectable()
export class RetentionService extends BaseService {
  constructor(
    @inject(AuditService) private readonly audit: AuditService,
    @inject(PrivacyNoticeService)
    private readonly privacyNoticeService: PrivacyNoticeService,
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(EventService) private readonly eventService: EventService,
  ) {
    super();
  }

  /** The event's open deadlines, sensitive first as it falls due first. */
  async deadlines(
    event: RetentionEvent,
    now: Date = new Date(),
  ): Promise<Deadline[]> {
    const [promised, states] = await Promise.all([
      this.promised(event),
      this.prisma.eventRetentionState.findMany({
        where: { eventId: event.id },
        include: { postponedBy: { select: { name: true } } },
      }),
    ]);
    const stateOf = (kind: EventRetentionDeadlineKind) =>
      states.find((state) => state.kind === kind) ?? null;

    const effective = effectiveDeadlines(promised, {
      sensitive: stateOf('sensitive')?.postponedUntil ?? null,
      registrations: stateOf('registrations')?.postponedUntil ?? null,
    });
    const today = currentDateInTimeZone(event.timezone, now);

    return EVENT_RETENTION_DEADLINE_KINDS.flatMap((kind): Deadline[] => {
      const dueAt = promised[kind];
      const effectiveAt = effective[kind];
      if (!dueAt || !effectiveAt || purgedAt(event, kind)) {
        return [];
      }

      return [
        {
          kind,
          dueAt,
          effectiveAt,
          status: deadlineStatus(effectiveAt, today),
          postponeRange: postponeRange(kind, effective, today),
          state: stateOf(kind),
        },
      ];
    });
  }

  /**
   * What the event's current notice states, for new registrations, and the
   * deadlines it would give where none exists yet.
   */
  async currentPeriods(
    event: RetentionEvent & { organizationId: string },
  ): Promise<{ periods: RetentionPeriods; estimates: DeadlineDates }> {
    const notice = await this.privacyNoticeService.getComposedNotice(
      event.id,
      event.organizationId,
    );
    const periods = retentionPeriods(notice?.retention, asksSensitive(event));

    return {
      periods,
      estimates: promisedDeadlines([periods], eventEndDate(event)),
    };
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
    // Once deleting began, a new reason would outlive nothing it could justify.
    const started =
      kind === 'sensitive'
        ? (event.sensitiveDataPurgedAt ?? event.registrationDataPurgedAt)
        : event.registrationDataPurgedAt;
    if (started) {
      throw new ApiError(httpStatus.CONFLICT, 'This data was already deleted.');
    }

    const deadline = (await this.deadlines(event)).find(
      (entry) => entry.kind === kind,
    );
    if (!deadline) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No such retention deadline.');
    }

    const range = deadline.postponeRange;
    if (!range || data.until < range.min || data.until > range.max) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        range
          ? `The new date must lie between ${range.min} and ${range.max}.`
          : 'This deadline cannot be postponed any further.',
      );
    }

    await this.transaction(async (tx) => {
      const postponement = {
        postponedUntil: data.until,
        postponeReason: data.reason,
        postponedAt: new Date(),
        postponedById: getRequestContext()?.userId ?? null,
      };
      const state = await tx.eventRetentionState.upsert({
        where: { eventId_kind: { eventId: event.id, kind } },
        create: { eventId: event.id, kind, ...postponement },
        update: postponement,
      });

      // The reason may name a person or a case, so only the date is logged.
      await this.audit.record({
        action: 'postponed',
        entityType: 'retention',
        entityId: state.id,
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
   * A rerun finishes an interrupted run, and clears what was tagged since.
   */
  async purgeSensitiveData(event: EventWithFreePlaces): Promise<number> {
    if (event.registrationDataPurgedAt) {
      return 0;
    }

    // Recorded first, on its own: from here on the event takes no
    // registrations, and no edit can bring sensitive answers back while the
    // registrations are cleared one by one. Done only once all are: an
    // interrupted run stays open and is simply run again.
    await this.markPurged(event.id, ['sensitive']);
    const cleared = await this.registrationService.clearSensitiveAnswers(event);

    // A rerun also clears answers to a question tagged since; the first
    // completion stays the date of the deletion.
    if (!event.sensitiveDataClearedAt) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: { sensitiveDataClearedAt: new Date() },
      });
    }
    if (!event.sensitiveDataClearedAt || cleared > 0) {
      await this.audit.record({
        action: 'sensitive_purged',
        entityType: 'retention',
        entityId: event.id,
        eventId: event.id,
        details: { values: { count: cleared } },
      });
    }

    return cleared;
  }

  /**
   * Deletes every registration of the event, all at once or not at all. Bed
   * assignments, files and audit entries are only detached; nothing financial
   * points at a registration. The event never takes registrations again.
   */
  async purgeRegistrationData(
    event: PurgeState & Pick<Event, 'id'>,
  ): Promise<number> {
    return this.transaction(
      async () => {
        // Sensitive data is a subset: deleting all of it deletes that too.
        await this.markPurged(event.id, EVENT_RETENTION_DEADLINE_KINDS);
        const deleted =
          await this.registrationService.deleteRegistrationsForEvent(event.id);

        await this.audit.record({
          action: 'registrations_purged',
          entityType: 'retention',
          entityId: event.id,
          eventId: event.id,
          details: { values: { count: deleted } },
        });

        return deleted;
      },
      // One statement, but it detaches every file, bed and audit entry of a
      // large event: Prisma's default of 5 s is too short for that.
      { timeout: PURGE_TIMEOUT_MS },
    );
  }

  /**
   * Records the deletion for good, once the event has ended and registration
   * has closed: the event then never reopens it (`assertRegistrationStaysClosed`).
   * Under the event's row lock, so an edit reopening it cannot slip in between.
   * Before the end the team may still need the data, health details above all;
   * a cancelled event is removed by deleting the event instead.
   */
  private async markPurged(
    eventId: string,
    kinds: readonly EventRetentionDeadlineKind[],
  ): Promise<void> {
    await this.transaction(async (tx) => {
      const event = await this.eventService.lockForUpdate(eventId);
      if (eventEndInstant(event) > new Date()) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Data can only be deleted once the event has ended.',
        );
      }
      if (eventRegistrationStatus(event) !== 'closed') {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Close the registration before deleting its data.',
        );
      }

      const now = new Date();
      await tx.event.update({
        where: { id: eventId },
        data: {
          ...(kinds.includes('sensitive')
            ? { sensitiveDataPurgedAt: event.sensitiveDataPurgedAt ?? now }
            : {}),
          ...(kinds.includes('registrations')
            ? {
                registrationDataPurgedAt: event.registrationDataPurgedAt ?? now,
              }
            : {}),
        },
      });
      // A reason may name a person or a case; once the data is gone, so is it.
      await tx.eventRetentionState.updateMany({
        where: { eventId, kind: { in: [...kinds] } },
        data: { postponeReason: null },
      });
    });
  }

  /**
   * Open deadlines of the organization's events, for its overview: dates and
   * kinds only, never registration data.
   */
  async openDeadlines(organizationId: string) {
    const entries: (Deadline & { event: RetentionEventWithName })[] = [];
    for await (const event of this.eventsWithRegistrations({
      organizationId,
    })) {
      for (const deadline of await this.deadlines(event)) {
        entries.push({ ...deadline, event });
      }
    }

    return entries.sort((a, b) => a.effectiveAt.localeCompare(b.effectiveAt));
  }

  /**
   * Every event that can have an open deadline: registrations under a stamped
   * notice, not all deleted. Read in batches by id, as each brings its form.
   */
  async *eventsWithRegistrations(
    where: Prisma.EventWhereInput = {},
  ): AsyncGenerator<RetentionEventWithName> {
    const batches = batchesById(
      (page) =>
        this.prisma.event.findMany({
          ...page,
          where: {
            ...where,
            registrationDataPurgedAt: null,
            registrations: {
              some: { organizationPrivacyNoticeVersionId: { not: null } },
            },
            ...page.where,
          },
          select: RETENTION_EVENT_SELECT,
        }),
      BATCH_SIZE,
    );

    for await (const batch of batches) {
      yield* batch;
    }
  }

  /** The earliest date each kind was promised to be deleted by. */
  private async promised(event: RetentionEvent): Promise<DeadlineDates> {
    // Each pair of notice versions the registrants were shown, once.
    const stamps = await this.prisma.registration.findMany({
      where: {
        eventId: event.id,
        organizationPrivacyNoticeVersionId: { not: null },
      },
      distinct: [
        'organizationPrivacyNoticeVersionId',
        'eventPrivacyNoticeVersionId',
      ],
      select: {
        organizationPrivacyNoticeVersionId: true,
        eventPrivacyNoticeVersionId: true,
      },
    });

    const contentOf = await this.stampedContent(
      stamps.flatMap((stamp) => [
        stamp.organizationPrivacyNoticeVersionId,
        stamp.eventPrivacyNoticeVersionId,
      ]),
    );
    const asks = asksSensitive(event);
    const periods = stamps.map((stamp) =>
      retentionPeriods(
        composePrivacyNotice(
          contentOf(stamp.organizationPrivacyNoticeVersionId),
          contentOf(stamp.eventPrivacyNoticeVersionId),
        ).retention,
        asks,
      ),
    );

    return promisedDeadlines(periods, eventEndDate(event));
  }

  /** Resolves every stamped version in one query, as a lookup by id. */
  private async stampedContent(ids: (string | null)[]) {
    const versions = await this.prisma.privacyNoticeVersion.findMany({
      where: { id: { in: [...new Set(ids.filter((id) => id !== null))] } },
      select: { id: true, content: true },
    });
    const byId = new Map<string, PrivacyNoticeContent>(
      versions.map(({ id, content }) => [id, content]),
    );

    return (id: string | null) => (id ? (byId.get(id) ?? null) : null);
  }
}

const RETENTION_EVENT_SELECT = {
  id: true,
  name: true,
  endAt: true,
  timezone: true,
  form: true,
  sensitiveDataPurgedAt: true,
  sensitiveDataClearedAt: true,
  registrationDataPurgedAt: true,
} as const satisfies Prisma.EventSelect;

export type RetentionEventWithName = Prisma.EventGetPayload<{
  select: typeof RETENTION_EVENT_SELECT;
}>;

/** The day the event ends, in its time zone: what every period counts from. */
function eventEndDate(event: Pick<Event, 'endAt'>): string {
  return utcCarrierToNaiveDateTime(event.endAt).slice(0, 10);
}

/** `endAt` is a UTC carrier of local digits; this is the real moment it ends. */
function eventEndInstant(event: Pick<Event, 'endAt' | 'timezone'>): Date {
  return zonedInstant(utcCarrierToNaiveDateTime(event.endAt), event.timezone);
}

/** A form without special-category questions holds no sensitive data. */
function asksSensitive(event: Pick<Event, 'form'>): boolean {
  return extractPrivacyTags(event.form).tagged.some((tag) =>
    isSpecialCategory(tag.category),
  );
}
