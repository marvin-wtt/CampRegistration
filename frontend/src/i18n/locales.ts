import {
  APP_LOCALES as APP_LOCALES_READONLY,
  type AppLocale,
  localesForCountries as localesForCountriesOf,
} from '@camp-registration/common/locales';

export type { AppLocale };
export { COUNTRY_LOCALES } from '@camp-registration/common/locales';

/**
 * The languages the application ships content in — shared with the backend
 * (`@camp-registration/common/locales`) so forms, table templates, message
 * templates and this list can't drift apart on what "supported" means.
 *
 * Mutable on purpose: it is passed straight to `string[]` component props.
 */
export const APP_LOCALES: AppLocale[] = [...APP_LOCALES_READONLY];

/**
 * The languages a event writes its own texts in. Every locale when the event
 * names no country — offering nothing to write in would be worse than offering
 * too much.
 */
export function localesForCountries(
  countries: string[] | undefined,
): AppLocale[] {
  const matched = localesForCountriesOf(countries ?? []);

  return matched.length > 0 ? matched : [...APP_LOCALES];
}
