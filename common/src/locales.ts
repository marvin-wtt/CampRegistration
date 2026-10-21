/**
 * The languages the application ships content in - forms, table templates,
 * message templates and the frontend's own UI all carry a translation per
 * entry here. Kept in one place so frontend and backend can't drift apart on
 * what "supported" means.
 */
export const APP_LOCALES = ['en', 'de', 'fr', 'cs', 'pl'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

const COUNTRY_LOCALE_MAP = {
  de: 'de',
  fr: 'fr',
  gb: 'en',
  us: 'en',
  pl: 'pl',
  cz: 'cs',
} as const satisfies Record<string, AppLocale>;

/**
 * The language each country writes in. Countries and locales only look alike
 * (`gb` → `en`, `cz` → `cs`): a value stored under one is never found by
 * looking up the other.
 */
export const COUNTRY_LOCALES: Readonly<Record<string, AppLocale>> =
  COUNTRY_LOCALE_MAP;

/**
 * The countries an event can be created for. Each must have a language above —
 * one without would silently be written in English.
 */
export const EVENT_COUNTRIES = [
  'de',
  'fr',
  'gb',
  'pl',
  'cz',
] as const satisfies readonly (keyof typeof COUNTRY_LOCALE_MAP)[];

/** The app locale a country writes in, English when it has none. */
export function localeForCountry(country: string): AppLocale {
  return COUNTRY_LOCALES[country.toLowerCase()] ?? 'en';
}

/** The app locales an event's countries write in, in `APP_LOCALES` order. */
export function localesForCountries(countries: readonly string[]): AppLocale[] {
  const wanted = new Set(countries.map(localeForCountry));

  return APP_LOCALES.filter((locale) => wanted.has(locale));
}
