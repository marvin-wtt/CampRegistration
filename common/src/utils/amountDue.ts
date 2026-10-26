import { toMinorUnits } from './money.js';

/** The `eventDataType` tag a form question uses to contribute to the amount due. */
export const PAYMENT_AMOUNT_TAG = 'payment_amount';

/**
 * The amount a registration owes, in minor units of the event currency: the
 * event's price plus what the answers add (`extractPaymentAmounts`; numbers,
 * or numeric strings from expressions). The server computes it from the
 * validated form data — a client never sends an amount; the registration form
 * only previews the same total. Negative totals clamp to zero.
 */
export function computeAmountDue(
  event: { price: number; currency: string },
  amounts: unknown[],
): number {
  const total = amounts
    .map((value) => (typeof value === 'string' ? Number(value) : value))
    .filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    )
    .reduce((sum, value) => sum + value, event.price);

  return Math.max(0, toMinorUnits(total, event.currency));
}
