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
