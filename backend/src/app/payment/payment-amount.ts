import type { Event } from '#generated/prisma/client.js';
import { toMinorUnits } from '@camp-registration/common/utils';

/** The `eventDataType` tag a form question uses to contribute to the amount due. */
export const PAYMENT_AMOUNT_TAG = 'payment_amount';

/**
 * The amount a registration owes, in minor units of the event currency, from
 * its submitted answers: the sum of every question tagged `payment_amount`
 * (numbers, or numeric strings from expressions), else the event's flat
 * price. Always computed server-side from the validated form data — a client
 * never sends an amount. Negative totals clamp to zero.
 */
export function computeAmountDue(
  event: Pick<Event, 'price' | 'currency'>,
  dataByTags: Record<string, unknown[]>,
): number {
  const tagged = (dataByTags[PAYMENT_AMOUNT_TAG] ?? [])
    .map((value) => (typeof value === 'string' ? Number(value) : value))
    .filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    );

  const total =
    tagged.length > 0
      ? tagged.reduce((sum, value) => sum + value, 0)
      : event.price;

  return Math.max(0, toMinorUnits(total, event.currency));
}
