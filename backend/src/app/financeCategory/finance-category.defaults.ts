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

const DEFAULT_INCOME_CATEGORIES: Localized[] = [
  {
    en: 'Grants',
    de: 'Zuschüsse',
    fr: 'Subventions',
    cs: 'Dotace',
    pl: 'Dotacje',
  },
  { en: 'Donations', de: 'Spenden', fr: 'Dons', cs: 'Dary', pl: 'Darowizny' },
  {
    en: 'Own contributions',
    de: 'Eigenmittel',
    fr: 'Fonds propres',
    cs: 'Vlastní zdroje',
    pl: 'Środki własne',
  },
  { en: 'Other', de: 'Sonstiges', fr: 'Autres', cs: 'Ostatní', pl: 'Inne' },
];

export interface DefaultFinanceCategory {
  name: string | Record<string, string>;
  position: number;
}

/** The generic starting list of one kind, in the event's languages only. */
export function defaultFinanceCategoriesForCountries(
  countries: readonly string[],
  kind: 'EXPENSE' | 'INCOME' = 'EXPENSE',
): DefaultFinanceCategory[] {
  const locales = localesForCountries(countries);
  const list =
    kind === 'INCOME' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_CATEGORIES;

  return list.map((names, position) => ({
    // A single language is stored as a plain string, like other event texts.
    name:
      locales.length === 1
        ? names[locales[0] ?? 'en']
        : Object.fromEntries(locales.map((locale) => [locale, names[locale]])),
    position,
  }));
}
