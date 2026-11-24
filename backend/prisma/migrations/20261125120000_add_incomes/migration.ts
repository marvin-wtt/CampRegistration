import type { Prisma } from '#generated/prisma/client.js';
import { monotonicFactory } from 'ulidx';
import { localesForCountries } from '@camp-registration/common/locales';

/**
 * Income gets categories of its own (kind `INCOME`). New events are created
 * with these defaults; existing events get them here, in their languages, so
 * the income picker isn't empty. Events that already have any income category
 * are left alone.
 */
const DEFAULTS: Record<string, string>[] = [
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

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const ulid = monotonicFactory();
  const events = await tx.event.findMany({
    where: { financeCategories: { none: { kind: 'INCOME' } } },
    select: { id: true, countries: true },
  });

  for (const event of events) {
    const countries = Array.isArray(event.countries)
      ? event.countries.filter((c): c is string => typeof c === 'string')
      : [];
    const locales = localesForCountries(countries);

    await tx.financeCategory.createMany({
      data: DEFAULTS.map((names, position) => ({
        id: ulid(),
        eventId: event.id,
        kind: 'INCOME',
        // A single language is stored as a plain string, like other event texts.
        name:
          locales.length === 1
            ? (names[locales[0] ?? 'en'] ?? names.en)
            : Object.fromEntries(
                locales.map((locale) => [locale, names[locale] ?? names.en]),
              ),
        position,
      })),
    });
  }
}
