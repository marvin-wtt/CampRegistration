import { Prisma } from '#generated/prisma/client.js';
import {
  utcCarrierToNaiveDateTime,
  zonedInstant,
} from '@camp-registration/common/utils';

/**
 * What a bill charges for: an administrator's correction if any, else the
 * higher of the start and end counts.
 */
export function billedRegistrationCount(bill: {
  startRegistrationCount: number;
  endRegistrationCount: number | null;
  adjustedRegistrationCount: number | null;
}): number {
  return (
    bill.adjustedRegistrationCount ??
    Math.max(bill.startRegistrationCount, bill.endRegistrationCount ?? 0)
  );
}

export { BILLING_TIME_ZONE } from '@camp-registration/common/entities';

/** The organization fields frozen onto a bill as its customer. */
export const customerSelect = {
  name: true,
  addressStreet: true,
  addressZipCode: true,
  addressCity: true,
  country: true,
  vatNumber: true,
} as const;

export function customerSnapshot(organization: {
  name: string;
  addressStreet: string;
  addressZipCode: string;
  addressCity: string;
  country: string;
  vatNumber: string | null;
}) {
  return {
    customerName: organization.name,
    customerAddressStreet: organization.addressStreet,
    customerAddressZipCode: organization.addressZipCode,
    customerAddressCity: organization.addressCity,
    customerCountry: organization.country,
    customerVatNumber: organization.vatNumber,
  };
}

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
