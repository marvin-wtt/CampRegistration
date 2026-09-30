import { Prisma } from '#generated/prisma/client.js';
import {
  utcCarrierToNaiveDateTime,
  zonedInstant,
} from '@camp-registration/common/utils';

/**
 * The seeded free model the migration assigns to every existing organization.
 * The id is fixed so fixtures and the default fallback can refer to it.
 */
export const FREE_PRICE_MODEL_ID = '01K6B00000000000000000FREE';

/** Its name, as the migration seeds it. */
export const FREE_PRICE_MODEL_NAME = {
  en: 'Free',
  de: 'Kostenlos',
  fr: 'Gratuit',
  pl: 'Bezpłatny',
  cs: 'Zdarma',
};

export interface BillPricing {
  pricePerRegistration: Prisma.Decimal;
  baseFee: Prisma.Decimal;
  /** Percent, e.g. 19.00 */
  taxRate: Prisma.Decimal;
}

export interface BillAmounts {
  netAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  grossAmount: Prisma.Decimal;
}

/**
 * `net = base fee + price × count`, tax rounded half-up to the cent, and
 * `gross = net + tax` — so the three always add up exactly.
 */
export function calculateBillAmounts(
  pricing: BillPricing,
  registrationCount: number,
): BillAmounts {
  const netAmount = new Prisma.Decimal(pricing.baseFee)
    .plus(
      new Prisma.Decimal(pricing.pricePerRegistration).times(registrationCount),
    )
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const taxAmount = netAmount
    .times(pricing.taxRate)
    .dividedBy(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return {
    netAmount,
    taxAmount,
    grossAmount: netAmount.plus(taxAmount),
  };
}

/**
 * The real instant of an event date. `startAt`/`endAt` hold the organizer's
 * wall-clock digits in a UTC-typed column, so they must never be compared with
 * `new Date()` directly.
 */
export function eventInstant(carrier: Date, timezone: string): Date {
  return zonedInstant(utcCarrierToNaiveDateTime(carrier), timezone);
}
