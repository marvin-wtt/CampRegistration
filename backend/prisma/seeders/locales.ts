import type { Camp } from '#generated/prisma/client.js';
import { countriesToLocales } from '#utils/countriesToLocales';

/** The locales a camp can actually render, derived from its countries. */
export function campLocales(camp: Camp): string[] {
  return [...new Set(countriesToLocales(camp.countries))];
}

/**
 * Narrows a translated seed value to the locales the camp offers, so no camp
 * carries a translation it can never display. A value left with a single locale
 * is stored as a plain string, exactly as a single-country camp would store it.
 */
export function forLocales(
  value: string | Record<string, string>,
  locales: string[],
): string | Record<string, string> {
  if (typeof value === 'string') {
    return value;
  }

  const entries = locales
    .filter((locale) => locale in value)
    .map((locale) => [locale, value[locale]] as const);

  if (entries.length === 0) {
    // The seed data has nothing for this camp's languages — fall back to one
    // string rather than storing translations nobody will see.
    return value.en ?? Object.values(value)[0]!;
  }

  return entries.length === 1
    ? entries[0]![1]!
    : Object.fromEntries(entries as [string, string][]);
}
