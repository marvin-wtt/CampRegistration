import type { PriceModel } from '#generated/prisma/client.js';

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

type Pricing = Pick<
  PriceModel,
  'currency' | 'pricePerRegistration' | 'baseFee' | 'taxRate'
>;

/**
 * Whether moving from `current` to `next` makes nothing more expensive, so
 * it may apply without the organization's consent. A change of currency
 * can't be compared, so it always needs consent.
 */
export function costsNoMore(current: Pricing, next: Pricing): boolean {
  return (
    current.currency === next.currency &&
    next.pricePerRegistration.lessThanOrEqualTo(current.pricePerRegistration) &&
    next.baseFee.lessThanOrEqualTo(current.baseFee) &&
    next.taxRate.lessThanOrEqualTo(current.taxRate)
  );
}
