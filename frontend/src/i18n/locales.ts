import {
  APP_LOCALES as APP_LOCALES_READONLY,
  type AppLocale,
} from '@camp-registration/common/locales';

export type { AppLocale };

/**
 * The languages the application ships content in — shared with the backend
 * (`@camp-registration/common/locales`) so forms, table templates, message
 * templates and this list can't drift apart on what "supported" means.
 *
 * Mutable on purpose: it is passed straight to `string[]` component props.
 */
export const APP_LOCALES: AppLocale[] = [...APP_LOCALES_READONLY];

/**
 * A event declares the countries it runs in (`gb`, `us`, `cz`), while every
 * `Translatable` is read back by locale (`en`, `cs`). The two namespaces only
 * look alike: text stored under a country a reader is never looked up by is
 * text nobody is served.
 */
export const COUNTRY_LOCALES: Record<string, AppLocale> = {
  de: 'de',
  fr: 'fr',
  gb: 'en',
  us: 'en',
  pl: 'pl',
  cz: 'cs',
};

/**
 * The languages a event writes its own texts in. Every locale when the event
 * names no country — offering nothing to write in would be worse than offering
 * too much.
 */
export function localesForCountries(
  countries: string[] | undefined,
): AppLocale[] {
  const wanted = new Set(
    (countries ?? []).map((country) => COUNTRY_LOCALES[country]),
  );
  // Ordered by the app's own list rather than by the event's countries, so the
  // tabs do not reshuffle when a country is added.
  const matched = APP_LOCALES.filter((locale) => wanted.has(locale));

  return matched.length > 0 ? matched : [...APP_LOCALES];
}
