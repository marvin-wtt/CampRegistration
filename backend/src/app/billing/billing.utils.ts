import { type Event, Prisma } from '#generated/prisma/client.js';

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

/** The event fields frozen onto a bill, so it outlives later edits. */
export function eventSnapshot(
  event: Pick<Event, 'name' | 'startAt' | 'endAt' | 'timezone'>,
) {
  return {
    eventName: event.name,
    eventStartAt: event.startAt,
    eventEndAt: event.endAt,
    eventTimezone: event.timezone,
  };
}

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
