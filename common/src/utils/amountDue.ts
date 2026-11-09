import type { PerGroup } from '../entities/index.js';
import { toMinorUnits } from './money.js';
import { allGroupValues, forGroup } from './translatable.js';

/** The `eventDataType` tag a form question uses to contribute to the amount due. */
export const PAYMENT_AMOUNT_TAG = 'payment_amount';

/**
 * The event's price for a group, in minor units. Without a group the event
 * has a price for, the highest: a registration is never quoted too little.
 */
export function groupPrice(
  price: PerGroup<number>,
  group: string | null | undefined,
): number {
  return forGroup(price, group) ?? Math.max(0, ...allGroupValues(price));
}

/**
 * The amount a registration owes, in minor units of the event currency: the
 * group's price plus what the answers add (`extractPaymentAmounts`, in major
 * units). The server computes it from the validated form data — a client
 * never sends an amount; the registration form only previews the same total.
 * Negative totals clamp to zero.
 */
export function computeAmountDue(
  event: { price: PerGroup<number>; currency: string },
  amounts: number[],
  group: string | null | undefined,
): number {
  const added = amounts.reduce((sum, value) => sum + value, 0);

  return Math.max(
    0,
    groupPrice(event.price, group) + toMinorUnits(added, event.currency),
  );
}
