import { Prisma, type EventBillStatus } from '#generated/prisma/client.js';
import type {
  BillingMonth,
  BillingTotal,
} from '@camp-registration/common/entities';
import { money } from '#utils/money';
import { eachMonth, monthOf } from '#utils/date';

export interface SummarizedBill {
  status: EventBillStatus;
  currency: string | null;
  finalizedAt: Date | null;
  paidAt: Date | null;
  netAmount: Prisma.Decimal | null;
  taxAmount: Prisma.Decimal | null;
  grossAmount: Prisma.Decimal | null;
}

interface Totals {
  bills: number;
  net: Prisma.Decimal;
  tax: Prisma.Decimal;
  gross: Prisma.Decimal;
  received: Prisma.Decimal;
  open: Prisma.Decimal;
}

const zero = () => new Prisma.Decimal(0);

/**
 * Sums non-void bills into one row per month and currency, newest month
 * first. Every month is listed for every currency seen, so gaps read as zero.
 */
export function summarizeByMonth(
  bills: SummarizedBill[],
  months: string[],
  timeZone: string,
): BillingMonth[] {
  const totals = new Map<string, Totals>();
  const at = (month: string, currency: string): Totals | undefined => {
    if (!months.includes(month)) {
      return undefined;
    }
    const key = `${month}|${currency}`;
    let entry = totals.get(key);
    if (!entry) {
      entry = {
        bills: 0,
        net: zero(),
        tax: zero(),
        gross: zero(),
        received: zero(),
        open: zero(),
      };
      totals.set(key, entry);
    }
    return entry;
  };

  const currencies = new Set<string>();
  for (const bill of bills) {
    if (bill.status === 'VOID' || !bill.currency) {
      continue;
    }
    currencies.add(bill.currency);
    const gross = bill.grossAmount ?? zero();

    const billed =
      bill.finalizedAt &&
      at(monthOf(bill.finalizedAt, timeZone), bill.currency);
    if (billed) {
      billed.bills++;
      billed.net = billed.net.plus(bill.netAmount ?? zero());
      billed.tax = billed.tax.plus(bill.taxAmount ?? zero());
      billed.gross = billed.gross.plus(gross);
      if (bill.status === 'OPEN') {
        billed.open = billed.open.plus(gross);
      }
    }

    const received =
      bill.status === 'PAID' &&
      bill.paidAt &&
      at(monthOf(bill.paidAt, timeZone), bill.currency);
    if (received) {
      received.received = received.received.plus(gross);
    }
  }

  return [...months].reverse().flatMap((month) =>
    [...currencies].sort().map((currency) => {
      const entry = totals.get(`${month}|${currency}`);

      return {
        month,
        currency,
        bills: entry?.bills ?? 0,
        netAmount: money(entry?.net ?? zero()),
        taxAmount: money(entry?.tax ?? zero()),
        grossAmount: money(entry?.gross ?? zero()),
        receivedAmount: money(entry?.received ?? zero()),
        openAmount: money(entry?.open ?? zero()),
      };
    }),
  );
}

/**
 * The months of `year` worth listing: none before billing started (`first`)
 * and none after the current month.
 */
export function yearMonths(
  year: number,
  current: string,
  first: string | null,
): string[] {
  if (!first) {
    return [];
  }
  const january = `${year.toString()}-01`;
  const december = `${year.toString()}-12`;
  const from = first > january ? first : january;
  const to = current < december ? current : december;

  return from <= to ? eachMonth(from, to) : [];
}

/** Every year from the first bill's to the current one, newest first. */
export function billingYears(first: string | null, current: string): number[] {
  if (!first) {
    return [];
  }
  const years: number[] = [];
  for (
    let year = Number(current.slice(0, 4));
    year >= Number(first.slice(0, 4));
    year--
  ) {
    years.push(year);
  }
  return years;
}

/** The months added up, one total per currency. */
export function summarizeTotals(months: BillingMonth[]): BillingTotal[] {
  const totals = new Map<string, Totals>();
  for (const month of months) {
    const total = totals.get(month.currency) ?? {
      bills: 0,
      net: zero(),
      tax: zero(),
      gross: zero(),
      received: zero(),
      open: zero(),
    };
    total.bills += month.bills;
    total.net = total.net.plus(month.netAmount);
    total.tax = total.tax.plus(month.taxAmount);
    total.gross = total.gross.plus(month.grossAmount);
    total.received = total.received.plus(month.receivedAmount);
    total.open = total.open.plus(month.openAmount);
    totals.set(month.currency, total);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, total]) => ({
      currency,
      bills: total.bills,
      netAmount: money(total.net),
      taxAmount: money(total.tax),
      grossAmount: money(total.gross),
      receivedAmount: money(total.received),
      openAmount: money(total.open),
    }));
}
