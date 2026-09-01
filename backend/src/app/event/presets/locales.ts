import { countriesToLocales } from '#utils/countriesToLocales';
import { APP_LOCALES, type AppLocale } from '@camp-registration/common/locales';

function isSupportedLocale(locale: string): locale is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(locale);
}

export function localeForCountry(country: string): AppLocale {
  const locale = countriesToLocales([country]).find(isSupportedLocale);

  // Always fall back to English
  return locale ?? 'en';
}

export function localesForCountries(countries: string[]): AppLocale[] {
  return [...new Set(countries.map(localeForCountry))];
}
