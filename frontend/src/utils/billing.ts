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
