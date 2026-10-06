import {
  BILLING_TIME_ZONE,
  PRICE_MODEL_OFFER_MIN_NOTICE_DAYS,
} from '../entities/Billing.js';
import { calendarDateInTimeZone } from './calendarDate.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The first day (`YYYY-MM-DD`, billing time zone) a price increase offered at
 * `now` may take effect. Shared so the dialog never offers a day the API
 * refuses.
 */
export function earliestPriceChangeDay(now: Date): string {
  return calendarDateInTimeZone(
    new Date(now.getTime() + PRICE_MODEL_OFFER_MIN_NOTICE_DAYS * DAY_MS),
    BILLING_TIME_ZONE,
  );
}
