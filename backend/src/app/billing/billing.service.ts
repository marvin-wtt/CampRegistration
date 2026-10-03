import httpStatus from 'http-status';
import moment from 'moment';
import { injectable } from 'inversify';
import {
  type EventBill,
  type EventBillStatus,
  type PriceModel,
  Prisma,
} from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#utils/ApiError';
import logger from '#core/logger';
import type {
  AdminOverview,
  EventBillCreateData,
  EventBillUpdateData,
} from '@camp-registration/common/entities';
import {
  BILLING_TIME_ZONE,
  billedRegistrationCount,
  customerSelect,
  customerSnapshot,
  calculateBillAmounts,
  eventInstant,
} from './billing.utils.js';
import {
  billingYears,
  summarizeByMonth,
  summarizeTotals,
  yearMonths,
} from './billing.summary.js';
import { monthOf, monthRange } from '#utils/date';

/**
 * How long after its end an event that never got a DRAFT bill is still picked
 * up. Longer than the job interval, so an event shorter than one interval is
 * not missed — short enough that events which ended before billing existed are
 * never billed retroactively.
 */
const LATE_START_GRACE_HOURS = 1;

/**
 * The widest gap between an event's wall-clock digits and the real instant
 * (UTC−12…UTC+14), used to pre-filter in SQL before the exact zoned check.
 */
const TIMEZONE_SLACK_HOURS = 14;

const FINALIZE_BATCH_SIZE = 100;

const invoiceInclude = {
  invoices: { include: { files: true }, orderBy: { issuedAt: 'asc' } },
} satisfies Prisma.EventBillInclude;

const billInclude = {
  organization: { select: { id: true, name: true } },
  replacedBy: { select: { id: true } },
  ...invoiceInclude,
} satisfies Prisma.EventBillInclude;

// A DRAFT is priced with its event's model, or the one pinned on it when the
// event was deleted.
const organizationBillInclude = {
  replacedBy: { select: { id: true } },
  priceModel: { select: { id: true, name: true } },
  event: { select: { priceModel: { select: { id: true, name: true } } } },
  ...invoiceInclude,
} satisfies Prisma.EventBillInclude;

const draftInclude = {
  event: {
    select: {
      name: true,
      startAt: true,
      endAt: true,
      timezone: true,
      priceModel: true,
    },
  },
  priceModel: true,
  organization: { select: { ...customerSelect, priceModel: true } },
} satisfies Prisma.EventBillInclude;

function isUniqueViolation(error: unknown, column: string): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  // Depending on the driver adapter, `meta` names the index or the fields.
  const meta = JSON.stringify(error.meta ?? {});
  const camel = column.replace(/_(\w)/g, (_, c: string) => c.toUpperCase());

  return meta.includes(column) || meta.includes(camel);
}

/** Pricing and amounts, frozen onto a bill as it is finalized. */
function pricingSnapshot(priceModel: PriceModel, registrationCount: number) {
  return {
    priceModelId: priceModel.id,
    currency: priceModel.currency,
    pricePerRegistration: priceModel.pricePerRegistration,
    baseFee: priceModel.baseFee,
    taxRate: priceModel.taxRate,
    ...calculateBillAmounts(priceModel, registrationCount),
  };
}

const ALLOWED_TRANSITIONS: Partial<Record<EventBillStatus, EventBillStatus[]>> =
  {
    OPEN: ['PAID', 'VOID'],
    PAID: ['VOID'],
  };

@injectable()
export class BillingService extends BaseService {
  async getBillById(id: string) {
    return this.prisma.eventBill.findUnique({
      where: { id },
      include: organizationBillInclude,
    });
  }

  async getOverviewCounts(): Promise<AdminOverview['billing']> {
    const [draft, open, outstanding] = await Promise.all([
      this.prisma.eventBill.count({ where: { status: 'DRAFT' } }),
      this.prisma.eventBill.count({ where: { status: 'OPEN' } }),
      this.prisma.eventBill.groupBy({
        by: ['currency'],
        where: { status: 'OPEN', currency: { not: null } },
        _sum: { grossAmount: true },
        orderBy: { currency: 'asc' },
      }),
    ]);

    return {
      draft,
      open,
      outstanding: outstanding.map((row) => ({
        currency: row.currency ?? '',
        amount: (row._sum.grossAmount ?? new Prisma.Decimal(0)).toFixed(2),
      })),
    };
  }

  async queryBills(
    filter: {
      status?: EventBillStatus;
      organizationId?: string;
      search?: string;
      month?: string;
    } = {},
    options: { limit?: number; cursor?: string } = {},
  ) {
    const limit = options.limit ?? 25;
    const finalized = filter.month
      ? monthRange(filter.month, BILLING_TIME_ZONE)
      : null;
    const where: Prisma.EventBillWhereInput = {
      status: filter.status,
      organizationId: filter.organizationId,
      finalizedAt: finalized
        ? { gte: finalized.start, lt: finalized.end }
        : undefined,
      // The customer name still finds bills of deleted organizations.
      OR: filter.search
        ? [
            { organization: { name: { contains: filter.search } } },
            { customerName: { contains: filter.search } },
          ]
        : undefined,
    };

    // Over-fetch by one to detect a further page. ULIDs are time-ordered, so
    // `id` alone is a stable newest-first cursor.
    const items = await this.prisma.eventBill.findMany({
      where,
      include: billInclude,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: { id: 'desc' },
    });

    const hasMore = items.length > limit;
    const bills = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (bills[bills.length - 1]?.id ?? null) : null;
    const total = options.cursor
      ? undefined
      : await this.prisma.eventBill.count({ where });

    return { bills, nextCursor, limit, total };
  }

  /**
   * The end of the event's replacement chain: its only bill that counts. Only
   * the owning organization's, so a moved event shows nothing of the former
   * owner's billing.
   */
  async getLiveBillForEvent(eventId: string, organizationId: string) {
    return this.prisma.eventBill.findFirst({
      where: { eventId, organizationId },
      include: { replacedBy: { select: { id: true } }, ...invoiceInclude },
      orderBy: { sequence: 'desc' },
    });
  }

  /**
   * Billing per month and currency for one calendar year. "Billed" counts by
   * the finalization (invoice) date, "received" by the payment date — both
   * matter for VAT, depending on whether it is due on invoicing or on payment.
   */
  async getYearSummary(year: number, now = new Date()) {
    const current = monthOf(now, BILLING_TIME_ZONE);
    const { _min } = await this.prisma.eventBill.aggregate({
      _min: { finalizedAt: true },
    });
    const first = _min.finalizedAt
      ? monthOf(_min.finalizedAt, BILLING_TIME_ZONE)
      : null;
    const months = yearMonths(year, current, first);

    const bills = months.length
      ? await this.prisma.eventBill.findMany({
          where: {
            status: { not: 'VOID' },
            currency: { not: null },
            OR: [
              { finalizedAt: this.monthsRange(months) },
              { paidAt: this.monthsRange(months) },
            ],
          },
          select: {
            status: true,
            currency: true,
            finalizedAt: true,
            paidAt: true,
            netAmount: true,
            taxAmount: true,
            grossAmount: true,
          },
        })
      : [];
    const rows = summarizeByMonth(bills, months, BILLING_TIME_ZONE);

    return {
      year,
      years: billingYears(first, current),
      months: rows,
      totals: summarizeTotals(rows),
    };
  }

  private monthsRange(months: string[]) {
    const { start } = monthRange(months[0] ?? '', BILLING_TIME_ZONE);
    const { end } = monthRange(
      months[months.length - 1] ?? '',
      BILLING_TIME_ZONE,
    );

    return { gte: start, lt: end };
  }

  /** Every finalized bill of the months, voided ones included, oldest first. */
  async getBillsForExport(from: string, to: string) {
    const { start } = monthRange(from, BILLING_TIME_ZONE);
    const { end } = monthRange(to, BILLING_TIME_ZONE);

    return this.prisma.eventBill.findMany({
      where: { finalizedAt: { gte: start, lt: end } },
      include: {
        organization: { select: { name: true } },
        invoices: { select: { type: true, number: true } },
      },
      orderBy: [{ finalizedAt: 'asc' }, { id: 'asc' }],
    });
  }

  async getBillsForOrganization(organizationId: string) {
    return this.prisma.eventBill.findMany({
      where: { organizationId },
      include: organizationBillInclude,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Settles a bill (PAID / VOID), edits its note, or corrects the billed count
   * of an OPEN bill. A correction re-prices the bill with the pricing frozen on
   * it and keeps the measured counts beside it as evidence; `null` removes it.
   */
  async updateBill(bill: EventBill, data: EventBillUpdateData) {
    const statusChange =
      data.status !== undefined && data.status !== bill.status
        ? data.status
        : undefined;

    if (statusChange) {
      const allowed = ALLOWED_TRANSITIONS[bill.status] ?? [];
      if (!allowed.includes(statusChange)) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `A ${bill.status} bill cannot become ${statusChange}.`,
        );
      }
    }

    let correction: Prisma.EventBillUpdateInput = {};
    if (data.adjustedRegistrationCount !== undefined) {
      if (bill.status !== 'OPEN') {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Only an open bill can be corrected. Void it and bill again instead.',
        );
      }
      // The invoice already sent states the amount; it must stay true.
      const invoiced = await this.prisma.invoice.count({
        where: { eventBillId: bill.id, type: 'INVOICE' },
      });
      if (invoiced > 0) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'An invoiced bill cannot be corrected. Delete its invoice first, or void it and bill again.',
        );
      }

      correction = {
        adjustedRegistrationCount: data.adjustedRegistrationCount,
        ...calculateBillAmounts(
          {
            pricePerRegistration:
              bill.pricePerRegistration ?? new Prisma.Decimal(0),
            baseFee: bill.baseFee ?? new Prisma.Decimal(0),
            taxRate: bill.taxRate ?? new Prisma.Decimal(0),
          },
          billedRegistrationCount({
            ...bill,
            adjustedRegistrationCount: data.adjustedRegistrationCount,
          }),
        ),
      };
    }

    const now = new Date();

    return this.prisma.eventBill.update({
      where: { id: bill.id },
      data: {
        note: data.note,
        ...correction,
        ...(statusChange
          ? {
              status: statusChange,
              paidAt: statusChange === 'PAID' ? now : undefined,
              voidedAt: statusChange === 'VOID' ? now : undefined,
            }
          : {}),
      },
      include: billInclude,
    });
  }

  /**
   * Bills by hand, finalized at once: an ended event that was never billed (it
   * ended before billing existed, or the jobs missed it), or a voided bill
   * again, e.g. with a different price model. An event with a bill is only
   * billed again through `replacesBillId`, which continues its sequence.
   *
   * A replacement inherits the voided bill's event snapshot and counts, so it
   * works even after the event was deleted. A bill for an event counts the
   * accepted registrations now; its start is past, so that one count stands
   * for both.
   */
  async createManualBill(data: EventBillCreateData) {
    const replaces = data.replacesBillId
      ? await this.getBillById(data.replacesBillId)
      : null;

    if (data.replacesBillId) {
      if (!replaces) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Bill not found');
      }
      if (replaces.status !== 'VOID') {
        throw new ApiError(
          httpStatus.CONFLICT,
          'Only a voided bill can be billed again.',
        );
      }
      if (replaces.replacedBy) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'This bill has already been billed again.',
        );
      }
    }

    const eventId = replaces ? replaces.eventId : (data.eventId ?? null);
    const event = eventId
      ? await this.prisma.event.findUnique({
          where: { id: eventId },
          include: { priceModel: true },
        })
      : null;

    if (data.eventId && !event) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    if (
      !replaces &&
      event &&
      eventInstant(event.endAt, event.timezone) > new Date()
    ) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The event has not ended yet; it is billed automatically when it does.',
      );
    }

    const organizationId = replaces
      ? replaces.organizationId
      : (event?.organizationId ?? null);
    const organization = organizationId
      ? await this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { ...customerSelect, priceModel: true },
        })
      : null;
    if (!organizationId || !organization) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'The organization was deleted and cannot be billed again.',
      );
    }

    const priceModel = await this.resolvePriceModel(
      data.priceModelId,
      event?.priceModel ?? organization.priceModel,
    );

    const counts = {
      ...(replaces
        ? {
            startRegistrationCount: replaces.startRegistrationCount,
            endRegistrationCount: replaces.endRegistrationCount,
          }
        : await this.countNow(eventId)),
      adjustedRegistrationCount: data.adjustedRegistrationCount ?? null,
    };
    const snapshot = pricingSnapshot(
      priceModel,
      billedRegistrationCount(counts),
    );
    const finalizedAt = new Date();
    const free = snapshot.grossAmount.isZero();

    try {
      return await this.prisma.eventBill.create({
        data: {
          eventId,
          organizationId,
          replacesBillId: replaces?.id ?? null,
          sequence: replaces ? replaces.sequence + 1 : 0,
          ...counts,
          eventName: event?.name ?? replaces?.eventName ?? '',
          eventStartAt: event?.startAt ?? replaces?.eventStartAt ?? finalizedAt,
          eventEndAt: event?.endAt ?? replaces?.eventEndAt ?? finalizedAt,
          eventTimezone:
            event?.timezone ?? replaces?.eventTimezone ?? 'Europe/Berlin',
          ...customerSnapshot(organization),
          ...snapshot,
          status: free ? 'PAID' : 'OPEN',
          finalizedAt,
          paidAt: free ? finalizedAt : null,
          note: data.note ?? null,
        },
        include: billInclude,
      });
    } catch (error: unknown) {
      if (isUniqueViolation(error, 'sequence')) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'The event has already been billed. Void its bill and bill that again instead.',
        );
      }
      if (isUniqueViolation(error, 'replaces_bill_id')) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'This bill has already been billed again.',
        );
      }
      throw error;
    }
  }

  private async resolvePriceModel(
    requestedId: string | undefined,
    fallback: PriceModel,
  ): Promise<PriceModel> {
    if (requestedId) {
      const requested = await this.prisma.priceModel.findUnique({
        where: { id: requestedId },
      });
      if (!requested) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown price model');
      }
      if (requested.archivedAt) {
        throw new ApiError(
          httpStatus.CONFLICT,
          'An archived price model cannot be used for a new bill.',
        );
      }
      return requested;
    }

    return fallback;
  }

  async countAccepted(eventId: string): Promise<number> {
    return this.prisma.registration.count({
      where: { eventId, status: 'ACCEPTED' },
    });
  }

  private async countNow(eventId: string | null) {
    const count = eventId ? await this.countAccepted(eventId) : 0;

    return {
      startRegistrationCount: count,
      endRegistrationCount: count,
    };
  }

  /**
   * Opens a DRAFT bill for every event that has started, recording how many
   * registrations were accepted at that moment — the first of the two counts
   * a bill is based on.
   *
   * An event with any bill, voided ones included, is left alone: voiding was
   * a deliberate decision, and billing again is an explicit action. The unique
   * `(eventId, sequence)` makes a second instance, or a second run, lose with
   * P2002 instead of creating a duplicate.
   */
  async openDraftsForStartedEvents(now = new Date()): Promise<void> {
    const events = await this.prisma.event.findMany({
      where: {
        bills: { none: {} },
        startAt: {
          lt: moment(now).add(TIMEZONE_SLACK_HOURS, 'hours').toDate(),
        },
        endAt: {
          gt: moment(now)
            .subtract(TIMEZONE_SLACK_HOURS + LATE_START_GRACE_HOURS, 'hours')
            .toDate(),
        },
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        startAt: true,
        endAt: true,
        timezone: true,
      },
      orderBy: { startAt: 'asc' },
    });

    const lateLimit = moment(now)
      .subtract(LATE_START_GRACE_HOURS, 'hours')
      .toDate();

    for (const event of events) {
      if (
        eventInstant(event.startAt, event.timezone) > now ||
        eventInstant(event.endAt, event.timezone) < lateLimit
      ) {
        continue;
      }

      try {
        await this.transaction(async (tx) => {
          const accepted = await tx.registration.count({
            where: { eventId: event.id, status: 'ACCEPTED' },
          });

          await tx.eventBill.create({
            data: {
              eventId: event.id,
              organizationId: event.organizationId,
              startRegistrationCount: accepted,
              eventName: event.name,
              eventStartAt: event.startAt,
              eventEndAt: event.endAt,
              eventTimezone: event.timezone,
            },
          });
        });
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        logger.error(`Failed to open the bill for event ${event.id}:`, error);
      }
    }
  }

  /**
   * Finalizes every DRAFT bill whose event has ended. The accepted
   * registrations are counted a second time, and the higher of the start and
   * end counts is billed: someone who cancels during the event is still
   * covered by the start count, a late registration who stays by the end
   * count. The price model is the event's (or the one pinned on the bill when
   * the event was deleted), and pricing and amounts are written as a snapshot
   * so later model edits never touch a finalized bill.
   *
   * The event's current dates win over the snapshot, so a moved end date is
   * respected. A bill whose event was deleted mid-run has no end count and is
   * finalized with its start count; an administrator can void it.
   */
  async finalizeEndedEvents(now = new Date()): Promise<void> {
    const horizon = moment(now).add(TIMEZONE_SLACK_HOURS, 'hours').toDate();

    // Pages through every due draft, so drafts that are skipped or keep
    // failing never crowd the others out of a batch.
    let cursor: string | undefined;
    do {
      const drafts = await this.prisma.eventBill.findMany({
        where: {
          status: 'DRAFT',
          id: cursor ? { gt: cursor } : undefined,
          OR: [
            { eventId: null, eventEndAt: { lt: horizon } },
            { event: { is: { endAt: { lt: horizon } } } },
          ],
        },
        include: draftInclude,
        orderBy: { id: 'asc' },
        take: FINALIZE_BATCH_SIZE,
      });
      cursor =
        drafts.length === FINALIZE_BATCH_SIZE ? drafts.at(-1)?.id : undefined;

      await this.finalizeDrafts(drafts, now);
    } while (cursor);
  }

  private async finalizeDrafts(
    drafts: Prisma.EventBillGetPayload<{ include: typeof draftInclude }>[],
    now: Date,
  ): Promise<void> {
    for (const bill of drafts) {
      const end = bill.event
        ? eventInstant(bill.event.endAt, bill.event.timezone)
        : eventInstant(bill.eventEndAt, bill.eventTimezone);
      if (end > now) {
        continue;
      }
      // Deleting an organization is refused while it has a running bill.
      const { organization } = bill;
      if (!organization) {
        logger.error(`Bill ${bill.id} is running without an organization`);
        continue;
      }

      try {
        await this.transaction(async (tx) => {
          const endRegistrationCount = bill.eventId
            ? await tx.registration.count({
                where: { eventId: bill.eventId, status: 'ACCEPTED' },
              })
            : null;
          const priceModel =
            bill.event?.priceModel ??
            bill.priceModel ??
            organization.priceModel;
          const snapshot = pricingSnapshot(
            priceModel,
            billedRegistrationCount({ ...bill, endRegistrationCount }),
          );
          const finalizedAt = new Date();
          const free = snapshot.grossAmount.isZero();

          await tx.eventBill.updateMany({
            where: { id: bill.id, status: 'DRAFT' },
            data: {
              ...(bill.event
                ? {
                    eventName: bill.event.name,
                    eventStartAt: bill.event.startAt,
                    eventEndAt: bill.event.endAt,
                    eventTimezone: bill.event.timezone,
                  }
                : {}),
              endRegistrationCount,
              ...customerSnapshot(organization),
              ...snapshot,
              status: free ? 'PAID' : 'OPEN',
              finalizedAt,
              paidAt: free ? finalizedAt : null,
            },
          });
        });
      } catch (error: unknown) {
        logger.error(`Failed to finalize bill ${bill.id}:`, error);
      }
    }
  }
}
