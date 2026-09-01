import type { Event } from '#generated/prisma/client.js';
import { countriesToLocales } from '#utils/countriesToLocales';

/** The locales a event can actually render, derived from its countries. */
export function eventLocales(event: Event): string[] {
  return [...new Set(countriesToLocales(event.countries))];
}

/**
 * Narrows a translated seed value to the locales the event offers, so no event
 * carries a translation it can never display. A value left with a single locale
 * is stored as a plain string, exactly as a single-country event would store it.
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
    // The seed data has nothing for this event's languages — fall back to one
    // string rather than storing translations nobody will see.
    return value.en ?? Object.values(value)[0]!;
  }

  return entries.length === 1
    ? entries[0]![1]!
    : Object.fromEntries(entries as [string, string][]);
}
