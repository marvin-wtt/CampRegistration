import type { EventBill } from '@camp-registration/common/entities';
import { parseNaiveDateTime } from '@camp-registration/common/utils';

function naiveDate(value: string): Date {
  const { year, month, day } = parseNaiveDateTime(value);

  return new Date(year, month - 1, day);
}

/** The event's dates as its organizer entered them, e.g. "1 Jul – 14 Jul 2026". */
export function formatBillPeriod(
  bill: Pick<EventBill, 'eventStartAt' | 'eventEndAt'>,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).formatRange(
    naiveDate(bill.eventStartAt),
    naiveDate(bill.eventEndAt),
  );
}

export type InvoiceOwner =
  { organizationId: string } | { eventId: string } | { billId: string };

/**
 * Invoices download through the organization's or the event's billing, or for
 * administrators through the bill, which outlives its organization.
 */
export function invoiceUrl(owner: InvoiceOwner, invoiceId: string): string {
  const base =
    'billId' in owner
      ? `bills/${owner.billId}`
      : 'organizationId' in owner
        ? `organizations/${owner.organizationId}/billing`
        : `events/${owner.eventId}/billing`;

  return `${window.origin}/api/v1/${base}/invoices/${invoiceId}`;
}
