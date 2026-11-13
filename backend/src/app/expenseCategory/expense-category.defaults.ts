import {
  localesForCountries,
  type Localized,
} from '@camp-registration/common/locales';

const DEFAULT_CATEGORIES: Localized[] = [
  {
    en: 'Travel',
    de: 'Fahrtkosten',
    fr: 'Transport',
    cs: 'Doprava',
    pl: 'Podróże',
  },
  {
    en: 'Accommodation',
    de: 'Unterkunft',
    fr: 'Hébergement',
    cs: 'Ubytování',
    pl: 'Zakwaterowanie',
  },
  {
    en: 'Food',
    de: 'Verpflegung',
    fr: 'Repas',
    cs: 'Strava',
    pl: 'Wyżywienie',
  },
  {
    en: 'Materials',
    de: 'Material',
    fr: 'Matériel',
    cs: 'Materiál',
    pl: 'Materiały',
  },
  {
    en: 'Program',
    de: 'Programm',
    fr: 'Programme',
    cs: 'Program',
    pl: 'Program',
  },
  { en: 'Other', de: 'Sonstiges', fr: 'Autres', cs: 'Ostatní', pl: 'Inne' },
];

export interface DefaultExpenseCategory {
  name: string | Record<string, string>;
  position: number;
}

/** The generic starting list, in the event's languages only. */
export function defaultExpenseCategoriesForCountries(
  countries: readonly string[],
): DefaultExpenseCategory[] {
  const locales = localesForCountries(countries);

  return DEFAULT_CATEGORIES.map((names, position) => ({
    // A single language is stored as a plain string, like other event texts.
    name:
      locales.length === 1
        ? names[locales[0] ?? 'en']
        : Object.fromEntries(locales.map((locale) => [locale, names[locale]])),
    position,
  }));
}
