import type { Prisma } from '#generated/prisma/client.js';
import { ulid } from 'ulidx';

/**
 * Every event owns its expense categories; new events get the defaults on
 * creation. Give existing events the same list, in their own languages, so
 * nothing has to initialize lazily. Frozen copy of
 * `expense-category.defaults.ts` as of this migration.
 */
const DEFAULTS: Record<string, string>[] = [
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

const LOCALE_ORDER = ['en', 'de', 'fr', 'cs', 'pl'];
const COUNTRY_LOCALES: Record<string, string> = {
  de: 'de',
  fr: 'fr',
  gb: 'en',
  us: 'en',
  pl: 'pl',
  cz: 'cs',
};

function localesOf(countries: unknown): string[] {
  const list = Array.isArray(countries) ? countries : [];
  const wanted = new Set(
    list.map(
      (country) => COUNTRY_LOCALES[String(country).toLowerCase()] ?? 'en',
    ),
  );
  const locales = LOCALE_ORDER.filter((locale) => wanted.has(locale));

  return locales.length > 0 ? locales : ['en'];
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const events = await tx.event.findMany({
    where: { expenseCategories: { none: {} } },
    select: { id: true, countries: true },
  });

  const data = events.flatMap((event) => {
    const locales = localesOf(event.countries);

    return DEFAULTS.map((names, position) => ({
      id: ulid(),
      eventId: event.id,
      name:
        locales.length === 1
          ? (names[locales[0]] ?? names.en)
          : Object.fromEntries(
              locales.map((locale) => [locale, names[locale]]),
            ),
      position,
    }));
  });

  if (data.length > 0) {
    await tx.expenseCategory.createMany({ data });
  }
}
