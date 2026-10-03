import type { EventBill, InvoiceType } from '#generated/prisma/client.js';
import { toCsv } from '#utils/csv';
import { money } from '#utils/money';
import { dayOf } from '#utils/date';
import { translateObject } from '#utils/translateObject';
import { utcCarrierToNaiveDateTime } from '@camp-registration/common/utils';
import { billedRegistrationCount } from './billing.utils.js';

export type ExportedBill = EventBill & {
  organization: { name: string } | null;
  invoices: { type: InvoiceType; number: string | null }[];
};

// Machine-readable on purpose: ISO dates and dot decimals, so the file imports
// the same way whatever the reader's locale.
const HEADER = [
  'invoice_date',
  'bill_id',
  'invoice_number',
  'status',
  'customer',
  'customer_vat_number',
  'customer_country',
  'event',
  'event_start',
  'event_end',
  'registrations',
  'currency',
  'net_amount',
  'tax_rate',
  'tax_amount',
  'gross_amount',
  'paid_on',
  'voided_on',
  'replaces_bill_id',
];

/** One line per bill, for the platform's bookkeeping. */
export function billsToCsv(
  bills: ExportedBill[],
  timeZone: string,
  locale: string,
): string {
  const day = (date: Date | null) => (date ? dayOf(date, timeZone) : null);

  return toCsv(
    HEADER,
    bills.map((bill) => [
      day(bill.finalizedAt),
      bill.id,
      bill.invoices.find((invoice) => invoice.type === 'INVOICE')?.number,
      bill.status,
      bill.customerName ?? bill.organization?.name,
      bill.customerVatNumber,
      bill.customerCountry,
      translateObject(bill.eventName, locale),
      utcCarrierToNaiveDateTime(bill.eventStartAt).slice(0, 10),
      utcCarrierToNaiveDateTime(bill.eventEndAt).slice(0, 10),
      billedRegistrationCount(bill),
      bill.currency,
      money(bill.netAmount),
      money(bill.taxRate),
      money(bill.taxAmount),
      money(bill.grossAmount),
      day(bill.paidAt),
      day(bill.voidedAt),
      bill.replacesBillId,
    ]),
  );
}
