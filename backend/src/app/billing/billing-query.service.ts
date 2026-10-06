import { injectable } from 'inversify';
import { Prisma, type EventBillStatus } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import type { AdminOverview } from '@camp-registration/common/entities';
import { BILLING_TIME_ZONE } from './billing.utils.js';
import {
  billingYears,
  summarizeByMonth,
  summarizeTotals,
  yearMonths,
} from './billing.summary.js';
import { monthOf, monthRange } from '#utils/date';

export const invoiceInclude = {
  invoices: { include: { files: true }, orderBy: { issuedAt: 'asc' } },
} satisfies Prisma.EventBillInclude;

export const billInclude = {
  organization: { select: { id: true, name: true } },
  replacedBy: { select: { id: true } },
  ...invoiceInclude,
} satisfies Prisma.EventBillInclude;

// A DRAFT is priced with its event's model, or the one pinned on it when the
// event was deleted.
export const organizationBillInclude = {
  replacedBy: { select: { id: true } },
  priceModel: { select: { id: true, name: true } },
  event: { select: { priceModel: { select: { id: true, name: true } } } },
  ...invoiceInclude,
} satisfies Prisma.EventBillInclude;

/** Reading bills: listings, summaries, exports and the live bill of an event. */
@injectable()
export class BillingQueryService extends BaseService {
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

  async countAccepted(eventId: string): Promise<number> {
    return this.db.registration.count({
      where: { eventId, status: 'ACCEPTED' },
    });
  }
}
