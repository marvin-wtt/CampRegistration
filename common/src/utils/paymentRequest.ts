import type { PaymentSettings } from '../settings/types.js';
import { currentDateInTimeZone } from './calendarDate.js';

type RequestTiming = Pick<
  PaymentSettings,
  'timing' | 'requestDate' | 'requestDaysBeforeStart'
>;

/**
 * The first day (`YYYY-MM-DD`, in the event's time zone) payment requests go
 * out, or `null` when they go out as soon as a registration is accepted.
 * `startAt` is the event's naive local start.
 */
export function paymentRequestDate(
  settings: RequestTiming,
  startAt: string,
): string | null {
  switch (settings.timing) {
    case 'DATE':
      return settings.requestDate;
    case 'BEFORE_START': {
      if (settings.requestDaysBeforeStart === null) {
        return null;
      }
      const date = new Date(`${startAt.slice(0, 10)}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - settings.requestDaysBeforeStart);
      return date.toISOString().slice(0, 10);
    }
    default:
      return null;
  }
}

/** Whether an accepted registration is asked to pay yet. */
export function paymentRequestsOpen(
  settings: RequestTiming,
  event: { startAt: string; timezone: string },
  now = new Date(),
): boolean {
  const date = paymentRequestDate(settings, event.startAt);
  return date === null || currentDateInTimeZone(event.timezone, now) >= date;
}
