import type { Event, File, Prisma } from '#generated/prisma/client.js';
import { ulid } from '#utils/ulid';
import { dbNullable } from '#utils/db';
import type { OptionalByKeys } from '#types/utils';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service.js';
import { AuditService } from '#app/audit/audit.service';
import { eventAuditPolicy } from '#app/event/event.audit';

type TableTemplateCreateData = OptionalByKeys<
  Prisma.TableTemplateCreateManyEventInput,
  'id'
>[];
type MessageTemplateCreateData = (OptionalByKeys<
  Prisma.MessageTemplateCreateManyEventInput,
  'id'
> & { attachments?: File[] })[];
type FileCreateData = OptionalByKeys<Prisma.FileCreateManyEventInput, 'id'>[];

// The event's own fields, as plain values. Relations, generated columns and the
// query shape are the service's business — a caller never writes Prisma input.
// `retentionReminderSentAt` sits with the timestamps rather than the payload:
// it is written once by the retention job and never by an author.
export type EventCreateData = Omit<
  Event,
  'id' | 'createdAt' | 'updatedAt' | 'retentionReminderSentAt'
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
      include: { ...this.eventRegistrationInclude() },
    });

    return event === null ? null : enrichFreePlaces(event);
  }

  async getEventsByUserId(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        eventManager: {
          some: { userId },
        },
      },
      include: { ...this.eventRegistrationInclude() },
    });

    return events.map(enrichFreePlaces);
  }

  // `satisfies` rather than a return-type annotation: annotating this as
  // `Prisma.EventInclude` erases the literal `select` shapes, and every caller
  // would infer the full Organization instead of the two fields it asks for.
  private eventRegistrationInclude() {
    return {
      registrations: {
        where: {
          OR: [{ role: 'participant' }, { role: null }],
        },
        select: { country: true },
      },
      organization: {
        select: { id: true, name: true, verificationStatus: true },
      },
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
   * Resolve event ids whose translated `name` JSON matches the query in any
   * locale. Matching the serialized JSON with LIKE covers every locale value
   * without needing per-locale JSON paths.
   */
  private async eventIdsMatchingName(name: string): Promise<string[]> {
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

  private async buildEventWhere(
    filter: EventQueryArgs,
  ): Promise<Prisma.EventWhereInput> {
    const where: Prisma.EventWhereInput = {
      listed: filter.listed,
      organizationId: filter.organizationId,
      // The public directory only ever lists events run by a vetted
      // organization, independent of the event's own `listed` flag.
      ...(filter.listed === true
        ? { organization: { verificationStatus: 'VERIFIED' as const } }
        : {}),
      minAge: { lte: filter.age },
      maxAge: { gte: filter.age },
      startAt: { gte: filter.startAt },
      endAt: { lte: filter.endAt },
      ...(filter.managerUserId
        ? {
            eventManager: {
              some: {
                userId: filter.managerUserId,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          }
        : {}),
      ...(filter.status
        ? this.eventStatusWhere(filter.status, new Date())
        : {}),
    };

    // Nested under AND rather than spread: `eventStatusWhere` already claims the
    // top-level `OR`/`AND` keys for some statuses, and spreading would drop it.
    const countries = this.eventCountriesWhere(filter.country);
    if (countries) {
      const existing = where.AND;
      where.AND = [
        ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
        countries,
      ];
    }

    const name = filter.name?.trim();
    if (name && name.length >= MIN_NAME_FILTER_LENGTH) {
      where.id = { in: await this.eventIdsMatchingName(name) };
    }

    return where;
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

    const where = await this.buildEventWhere(filter);

    // Over-fetch by one to detect whether a further page exists. The `id`
    // tiebreaker keeps the cursor stable when the sort column has duplicates.
    const items = await this.prisma.event.findMany({
      where,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ [sortBy]: sortType }, { id: sortType }],
      include: { ...this.eventRegistrationInclude() },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
    // Only pay for the count on the first (uncursored) request.
    const total = options.cursor
      ? undefined
      : await this.prisma.event.count({ where });

    return { events: page.map(enrichFreePlaces), nextCursor, limit, total };
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

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          ...data,
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
        },
        include: { ...this.eventRegistrationInclude() },
      });

      await this.audit.record(tx, {
        action: 'created',
        entityType: eventAuditPolicy.entityType,
        entityId: created.id,
        eventId: created.id,
      });

      return created;
    });

    return {
      ...event,
      freePlaces: data.maxParticipants,
    };
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

  async moveEventToOrganization(eventId: string, organizationId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Read the "before" inside the transaction so the audit diff is race-free
      // (the request-model `event` may be stale relative to the actual write).
      const before = await tx.event.findUniqueOrThrow({
        where: { id: eventId },
      });

      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          organization: { connect: { id: organizationId } },
        },
        include: { ...this.eventRegistrationInclude() },
      });

      await this.audit.recordChange(tx, 'updated', eventAuditPolicy, {
        before,
        after: updatedEvent,
        entityId: eventId,
        eventId,
      });

      return enrichFreePlaces(updatedEvent);
    });
  }

  async updateEvent(event: Event, data: EventUpdateData) {
    return this.prisma.$transaction(async (tx) => {
      // Read the "before" inside the transaction so the audit diff is race-free
      // (the request-model `event` may be stale relative to the actual write).
      const before = await tx.event.findUniqueOrThrow({
        where: { id: event.id },
      });

      const updatedEvent = await tx.event.update({
        where: { id: event.id },
        data: {
          ...data,
          location: dbNullable(data.location),
        },
        include: { ...this.eventRegistrationInclude() },
      });

      await this.audit.recordChange(tx, 'updated', eventAuditPolicy, {
        before,
        after: updatedEvent,
        entityId: event.id,
        eventId: event.id,
      });

      return enrichFreePlaces(updatedEvent);
    });
  }

  async deleteEventById(id: string) {
    await this.prisma.$transaction(async (tx) => {
      // The FK's `onDelete: SetNull` orphans the event's existing audit rows
      // (eventId -> null) instead of deleting them, so they age out through the
      // normal retention window rather than vanishing with the event.
      await tx.event.delete({ where: { id } });

      // Keep one standalone record of who deleted the event — its most
      // destructive action. `eventId` is null (the event no longer exists).
      await this.audit.record(tx, {
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
): T & { freePlaces: number | Record<string, number> } => {
  if (typeof event.maxParticipants === 'number') {
    return {
      ...event,
      freePlaces: Math.max(
        0,
        event.maxParticipants - event.registrations.length,
      ),
    };
  }

  return {
    ...event,
    freePlaces: event.registrations.reduce(
      (acc, { country }) => {
        // Skip invalid registrations
        if (country === null || !(country in acc)) {
          return acc;
        }
        acc[country] = Math.max(0, acc[country] - 1);

        return acc;
      },
      { ...event.maxParticipants },
    ),
  };
};
