import type { Event, File, Prisma } from '#generated/prisma/client.js';
import { priceModelSummarySelect } from '#app/priceModel/price-model.resource';
import { ulid } from '#utils/ulid';
import { dbNullable } from '#utils/db';
import type { OptionalByKeys } from '#types/utils';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service.js';
import { AuditService } from '#app/audit/audit.service';
import { eventAuditPolicy } from '#app/event/event.audit';
import {
  calculateFreePlaces,
  type FreePlaces,
} from '#app/event/event.util';
import {
  EVENT_LOGO_SLOT,
  EVENT_BANNER_SLOT,
} from '@camp-registration/common/form';

type TableTemplateCreateData = OptionalByKeys<
  Prisma.TableTemplateCreateManyEventInput,
  'id'
>[];
type MessageTemplateCreateData = (OptionalByKeys<
  Prisma.MessageTemplateCreateManyEventInput,
  'id'
> & { attachments?: File[] })[];
type FileCreateData = OptionalByKeys<Prisma.FileCreateManyEventInput, 'id'>[];
type EventSettingCreateData = OptionalByKeys<
  Prisma.EventSettingCreateManyEventInput,
  'id'
>[];

// The event's own fields, as plain values. Relations, generated columns and the
// query shape are the service's business — a caller never writes Prisma input.
// `retentionReminderSentAt` sits with the timestamps rather than the payload:
// it is written once by the retention job and never by an author.
// `priceModelId` is billing's: only an administrator sets it, through the
// billing module.
export type EventCreateData = Omit<
  Event,
  'id' | 'createdAt' | 'updatedAt' | 'retentionReminderSentAt' | 'priceModelId'
>;
// Ownership moves through `moveEventToOrganization`, never a field update.
export type EventUpdateData = Partial<Omit<EventCreateData, 'organizationId'>>;

type EventRegistrationStatusFilter = 'open' | 'upcoming' | 'closed';

// A 1-character query LIKE-matches a large share of events (scanned via a
// leading-wildcard, un-indexable raw query), turning `eventIdsMatchingName`
// into a near-full-table scan whose `id IN (...)` result set is nearly as
// large as the table itself. Below this length, skip the name filter
// entirely rather than pay that cost for a query that isn't selective yet.
const MIN_NAME_FILTER_LENGTH = 2;
// The form editor autosaves; edits closer together than this form one entry.
const AUDIT_COALESCE_MS = 5 * 60 * 1000;

interface EventQueryArgs {
  listed?: boolean | undefined;
  name?: string | undefined;
  age?: number | undefined;
  startAt?: Date | string | undefined;
  endAt?: Date | string | undefined;
  country?: string | string[] | undefined;
  status?: EventRegistrationStatusFilter | undefined;
  managerUserId?: string | undefined;
  organizationId?: string | undefined;
}

@injectable()
export class EventService extends BaseService {
  constructor(
    @inject(FileService) private readonly fileService: FileService,
    @inject(AuditService) private readonly audit: AuditService,
  ) {
    super();
  }

  async getEventById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id },
      include: { ...this.eventResourceInclude() },
    });

    return event === null ? null : withMediaFlags(enrichFreePlaces(event));
  }

  /**
   * Live organization-verification check by id, for callers that must
   * re-query the database rather than trust a model bound earlier on a
   * long-lived request (e.g. a realtime subscriber's heartbeat refresh) —
   * unlike `eventOrganizationVerified`, which reads the cached
   * `req.modelOrFail('event')`.
   */
  async isOrganizationVerified(eventId: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organization: { select: { verificationStatus: true } } },
    });

    return event?.organization.verificationStatus === 'VERIFIED';
  }

  /** The public directory's events that have not ended yet. */
  async getSitemapEvents() {
    return this.prisma.event.findMany({
      where: {
        ...this.publicDirectoryWhere(),
        endAt: { gte: new Date() },
      },
      select: { id: true, updatedAt: true },
      orderBy: { startAt: 'asc' },
    });
  }

  async getEventsByUserId(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        eventManager: {
          some: { userId },
        },
      },
      include: { ...this.eventResourceInclude() },
    });

    return events.map((event) => withMediaFlags(enrichFreePlaces(event)));
  }

  private eventResourceInclude() {
    return {
      registrations: {
        where: {
          OR: [{ role: 'participant' }, { role: null }],
        },
        select: { country: true },
      },
      organization: {
        select: {
          id: true,
          name: true,
          verificationStatus: true,
          priceModelId: true,
        },
      },
      // Only `AdminEventResource` outputs it.
      priceModel: { select: priceModelSummarySelect },
      files: this.fileService.publicSlotFileInclude([
        EVENT_LOGO_SLOT,
        EVENT_BANNER_SLOT,
      ]),
    } satisfies Prisma.EventInclude;
  }

  /**
   * Build the registration-status filter as date conditions on the
   * registration window, mirroring the shared status derivation.
   */
  private eventStatusWhere(
    status: EventRegistrationStatusFilter,
    now: Date,
  ): Prisma.EventWhereInput {
    switch (status) {
      case 'upcoming':
        return {
          AND: [
            { registrationOpensAt: { gt: now } },
            // Check for invariant where close is before open
            {
              OR: [
                { registrationClosesAt: null },
                { registrationClosesAt: { gt: now } },
              ],
            },
          ],
        };
      case 'closed':
        return {
          OR: [
            { registrationOpensAt: null, registrationClosesAt: null },
            { registrationClosesAt: { lte: now } },
          ],
        };
      case 'open':
        return {
          AND: [
            {
              OR: [
                { registrationOpensAt: { not: null } },
                { registrationClosesAt: { not: null } },
              ],
            },
            {
              OR: [
                { registrationOpensAt: null },
                { registrationOpensAt: { lte: now } },
              ],
            },
            {
              OR: [
                { registrationClosesAt: null },
                { registrationClosesAt: { gt: now } },
              ],
            },
          ],
        };
    }
  }

  /**
   * Resolve event ids whose translated `name` JSON contains the query in any
   * locale. Matching the serialized JSON with LIKE covers every locale value
   * without needing per-locale JSON paths. `null` means "don't filter by name".
   */
  private async eventIdsMatchingName(query?: string): Promise<string[] | null> {
    const name = query?.trim();
    if (!name || name.length < MIN_NAME_FILTER_LENGTH) {
      return null;
    }

    const escaped = name
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM events
      WHERE JSON_SEARCH(name, 'one', ${`%${escaped}%`}) IS NOT NULL
    `;

    return rows.map((row) => row.id);
  }

  /** Events the user currently manages, ignoring expired assignments. */
  private eventManagerWhere(
    userId: string | undefined,
    now: Date,
  ): Prisma.EventWhereInput | null {
    if (!userId) {
      return null;
    }

    return {
      eventManager: {
        some: {
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
    };
  }

  private buildEventWhere(
    filter: EventQueryArgs,
    nameMatchIds: string[] | null,
  ): Prisma.EventWhereInput {
    const now = new Date();

    // One AND of independent clauses, so none can overwrite another's `OR`.
    // Prisma ignores `undefined` values, so unset filters need no guard.
    const clauses = [
      {
        organizationId: filter.organizationId,
        minAge: { lte: filter.age },
        maxAge: { gte: filter.age },
        startAt: { gte: filter.startAt },
        endAt: { lte: filter.endAt },
      },
      filter.listed ? this.publicDirectoryWhere() : { listed: filter.listed },
      filter.status ? this.eventStatusWhere(filter.status, now) : null,
      this.eventManagerWhere(filter.managerUserId, now),
      this.eventCountriesWhere(filter.country),
      nameMatchIds ? { id: { in: nameMatchIds } } : null,
    ];

    return { AND: clauses.filter((clause) => clause !== null) };
  }

  private publicDirectoryWhere(): Prisma.EventWhereInput {
    return {
      listed: true,
      // Only events run by a vetted organization, whatever their own flag.
      organization: { verificationStatus: 'VERIFIED' },
    };
  }

  /**
   * `countries` is a JSON array column, so each code needs its own
   * `array_contains`; several are OR-ed, matching a event that covers any of them.
   * Returns `null` when nothing was asked for, so the caller can skip the clause.
   */
  private eventCountriesWhere(
    country?: string | string[],
  ): Prisma.EventWhereInput | null {
    const codes = (Array.isArray(country) ? country : [country]).filter(
      (code): code is string => code !== undefined,
    );

    if (codes.length === 0) {
      return null;
    }

    return {
      OR: codes.map((code) => ({ countries: { array_contains: code } })),
    };
  }

  async queryEvents(
    filter: EventQueryArgs = {},
    options: {
      limit?: number;
      cursor?: string;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    } = {},
  ) {
    const limit = options.limit ?? 25;
    const sortBy = options.sortBy ?? 'startAt';
    const sortType = options.sortType ?? 'desc';

    const nameMatchIds = await this.eventIdsMatchingName(filter.name);
    const where = this.buildEventWhere(filter, nameMatchIds);

    // Over-fetch by one to detect whether a further page exists. The `id`
    // tiebreaker keeps the cursor stable when the sort column has duplicates.
    const items = await this.prisma.event.findMany({
      where,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ [sortBy]: sortType }, { id: sortType }],
      include: { ...this.eventResourceInclude() },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
    // Only pay for the count on the first (uncursored) request.
    const total = options.cursor
      ? undefined
      : await this.prisma.event.count({ where });

    return {
      events: page.map((event) => withMediaFlags(enrichFreePlaces(event))),
      nextCursor,
      limit,
      total,
    };
  }

  async getOverviewCounts() {
    const now = new Date();
    const [total, open, upcoming, closed] = await this.prisma.$transaction([
      this.prisma.event.count(),
      this.prisma.event.count({ where: this.eventStatusWhere('open', now) }),
      this.prisma.event.count({
        where: this.eventStatusWhere('upcoming', now),
      }),
      this.prisma.event.count({ where: this.eventStatusWhere('closed', now) }),
    ]);

    return { total, open, upcoming, closed };
  }

  async createEvent(
    userId: string,
    data: EventCreateData,
    tableTemplates: TableTemplateCreateData = [],
    messageTemplates: MessageTemplateCreateData = [],
    files: FileCreateData = [],
    settings: EventSettingCreateData = [],
  ) {
    const fileIds = files.map((f) => f.id).filter((f) => f != null);
    const fileIdMap = new Map<string, string>();
    const form = this.replaceFormFileUrls(data.form, fileIds, fileIdMap);

    // Copy files from reference event with new id
    const fileData = files.map((file) => ({
      ...file,
      // Use id from file map if present
      id: file.id ? fileIdMap.get(file.id) : undefined,
      // Override event id
      eventId: undefined,
      createdAt: undefined,
    }));

    const messageTemplateData = messageTemplates.map((template) => ({
      ...template,
      attachments:
        template.attachments && template.attachments.length > 0
          ? this.fileService.getFileCreateManyInput(template.attachments)
          : undefined,
    }));

    const event = await this.transaction(async (tx) => {
      // The event is pinned to the model its organization is on now, so a
      // later change of the organization's model leaves its price alone.
      const { priceModelId } = await tx.organization.findUniqueOrThrow({
        where: { id: data.organizationId },
        select: { priceModelId: true },
      });

      const created = await tx.event.create({
        data: {
          ...data,
          priceModelId,
          location: dbNullable(data.location),
          form,
          eventManager: {
            create: {
              userId,
              role: 'DIRECTOR',
            },
          },
          tableTemplates: {
            createMany: { data: this.stripIds(tableTemplates) },
          },
          messageTemplates: {
            createMany: { data: this.stripIds(messageTemplateData) },
          },
          files: { createMany: { data: fileData } },
          eventSettings: {
            createMany: { data: this.stripIds(settings) },
          },
        },
        include: { ...this.eventResourceInclude() },
      });

      await this.audit.created(eventAuditPolicy, created);

      return created;
    });

    return withMediaFlags({
      ...event,
      ...calculateFreePlaces(data.maxParticipants, []),
    });
  }

  /**
   * Removes the id and the event id of the relational data.
   * These fields are replaced by prisma during insertion.
   * @param data The create data
   */
  private stripIds<T extends object>(
    data: T[],
  ): (T & { id: undefined; eventId: undefined; createdAt: undefined })[] {
    return data.map((value) => ({
      ...value,
      // Override id and event id
      id: undefined,
      eventId: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }));
  }

  private replaceFormFileUrls(
    form: Record<string, unknown>,
    fileIds: readonly string[],
    fileIdMap: Map<string, string>,
  ): Record<string, unknown> {
    let formStr = JSON.stringify(form);

    for (const fileId of new Set(fileIds)) {
      if (!formStr.includes(fileId)) {
        continue;
      }

      const replacementId = fileIdMap.get(fileId) ?? ulid();

      fileIdMap.set(fileId, replacementId);
      formStr = formStr.replaceAll(fileId, replacementId);
    }

    return JSON.parse(formStr) as Record<string, unknown>;
  }

  /**
   * An event that is still on its old owner's model, and not billed yet,
   * follows its new owner's: that is who pays. A model chosen for the event
   * itself, or one a bill already used, stays.
   */
  async moveEventToOrganization(eventId: string, organizationId: string) {
    return this.transaction(async (tx) => {
      const before = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
        include: {
          organization: { select: { priceModelId: true } },
          _count: { select: { bills: true } },
        },
      });
      const target = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { priceModelId: true },
      });
      const followsOwner =
        before.priceModelId === before.organization.priceModelId &&
        before._count.bills === 0;

      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          organization: { connect: { id: organizationId } },
          ...(followsOwner
            ? { priceModel: { connect: { id: target.priceModelId } } }
            : {}),
        },
        include: { ...this.eventResourceInclude() },
      });

      await this.audit.updated(eventAuditPolicy, before, updatedEvent);

      return withMediaFlags(enrichFreePlaces(updatedEvent));
    });
  }

  async updateEvent(event: Event, data: EventUpdateData) {
    return this.transaction(async (tx) => {
      const before = await tx.event.findUniqueOrThrow({
        where: { id: event.id },
      });

      const updatedEvent = await tx.event.update({
        where: { id: event.id },
        data: {
          ...data,
          location: dbNullable(data.location),
        },
        include: { ...this.eventResourceInclude() },
      });

      await this.audit.updated(eventAuditPolicy, before, updatedEvent, {
        coalesceWithinMs: AUDIT_COALESCE_MS,
      });

      return withMediaFlags(enrichFreePlaces(updatedEvent));
    });
  }

  async deleteEventById(id: string) {
    await this.transaction(async (tx) => {
      // A running bill loses its event, so it keeps the event's model to be
      // finalized with.
      const { priceModelId } = await tx.event.findUniqueOrThrow({
        where: { id },
        select: { priceModelId: true },
      });
      await tx.eventBill.updateMany({
        where: { eventId: id, status: 'DRAFT' },
        data: { priceModelId },
      });

      // The FK nulls `eventId` on the event's audit rows; retention purges them later.
      await tx.event.delete({ where: { id } });

      await this.audit.record({
        action: 'deleted',
        entityType: eventAuditPolicy.entityType,
        entityId: id,
      });
    });
  }
}

// Generic so whatever relations the caller included (the owning organization,
// in particular) survive into the returned type.
const enrichFreePlaces = <
  T extends Event & { registrations: { country: string | null }[] },
>(
  event: T,
): T & FreePlaces => ({
  ...event,
  ...calculateFreePlaces(event.maxParticipants, event.registrations),
});

// `files` (from `publicSlotFileInclude`) only ever tells us which of the
// reserved slots have a ready, public file — collapse it to booleans here,
// right where the query's intent is known, instead of forwarding the array
// for every caller to reinterpret.
const withMediaFlags = <
  T extends { files: { id: string; field: string | null }[] },
>(
  event: T,
): Omit<T, 'files'> & { hasLogo: boolean; hasBanner: boolean } => {
  const { files, ...rest } = event;

  return {
    ...rest,
    hasLogo: files.some((file) => file.field === EVENT_LOGO_SLOT),
    hasBanner: files.some((file) => file.field === EVENT_BANNER_SLOT),
  };
};
