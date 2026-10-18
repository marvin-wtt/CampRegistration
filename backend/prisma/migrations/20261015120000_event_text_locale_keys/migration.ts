import { Prisma } from '#generated/prisma/client.js';
import { COUNTRY_LOCALES } from '@camp-registration/common/locales';

/**
 * An event's name and location are text, read by locale, but were stored per
 * country (`gb`, `cz`) — so readers of `en`/`cs` never found them. Re-key them
 * by the language each country writes in. Per-country fields (organizer,
 * contact email, limits) keep their country keys.
 *
 * A value already stored under the locale wins; otherwise the event's first
 * country of that language does (`gb` and `us` both become `en`).
 */
function toLocaleKeys<T extends string | Record<string, string> | null>(
  value: T,
  countries: string[],
): T {
  if (value === null || typeof value === 'string') {
    return value;
  }

  const entries = Object.entries(value);
  const rank = (key: string) => {
    const index = countries.indexOf(key);
    return index === -1 ? countries.length : index;
  };
  // Locale keys first, then countries in the event's own order.
  entries.sort(
    ([a], [b]) =>
      Number(a in COUNTRY_LOCALES) - Number(b in COUNTRY_LOCALES) ||
      rank(a) - rank(b),
  );

  const result: Record<string, string> = {};
  for (const [key, text] of entries) {
    const locale = COUNTRY_LOCALES[key] ?? key;
    if (!(locale in result)) {
      result[locale] = text;
    }
  }

  return result as T;
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const events = await tx.event.findMany({
    select: { id: true, countries: true, name: true, location: true },
  });

  for (const event of events) {
    const countries = Array.isArray(event.countries) ? event.countries : [];
    const name = toLocaleKeys(event.name, countries);
    const location = toLocaleKeys(event.location, countries);

    if (
      JSON.stringify(name) === JSON.stringify(event.name) &&
      JSON.stringify(location) === JSON.stringify(event.location)
    ) {
      continue;
    }

    await tx.event.update({
      where: { id: event.id },
      data: {
        name,
        location: location ?? Prisma.DbNull,
      },
    });
  }
}
