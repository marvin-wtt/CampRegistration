import type { PerCountry, Translatable } from '../entities/Translatable.js';

function isRecord<T>(value: T | Record<string, T>): value is Record<string, T> {
  return typeof value === 'object' && value !== null;
}

/**
 * A `Translatable` in one locale: the exact locale, then its language
 * (`de-AT` → `de`), then the fallback locale, then any value.
 */
export function translate<T>(
  value: Translatable<T> | null | undefined,
  locale: string,
  fallbackLocale = 'en',
): T | undefined {
  if (value === null || value === undefined || !isRecord(value)) {
    return value ?? undefined;
  }

  const candidates = [locale, fallbackLocale].flatMap((candidate) => [
    candidate,
    candidate.split('-')[0],
  ]);
  for (const candidate of candidates) {
    if (candidate && candidate in value) {
      return value[candidate];
    }
  }

  return Object.values(value)[0];
}

/**
 * A `PerCountry` value for one country. Without a country only a value that is
 * the same in every country resolves: guessing another country's limit or
 * contact would be wrong rather than incomplete.
 */
export function forCountry<T>(
  value: PerCountry<T> | null | undefined,
  country: string | null | undefined,
): T | undefined {
  if (value === null || value === undefined || !isRecord(value)) {
    return value ?? undefined;
  }

  if (country) {
    return value[country.toLowerCase()];
  }

  const values = allCountryValues(value);
  return values.length === 1 ? values[0] : undefined;
}

/**
 * The country a registration belongs to: the one it selected, or the event's
 * only country.
 */
export function eventCountry(
  event: { countries: readonly string[] },
  selected: string | null | undefined,
): string | null {
  if (selected) {
    return selected.toLowerCase();
  }

  return event.countries.length === 1 ? event.countries[0] : null;
}

/** Every country's distinct value, for when no single country applies. */
export function allCountryValues<T>(value: PerCountry<T>): T[] {
  return isRecord(value) ? [...new Set(Object.values(value))] : [value];
}

/** The sum over every country, e.g. an event's total participant limit. */
export function sumCountryValues(value: PerCountry<number>): number {
  return isRecord(value)
    ? Object.values(value).reduce((sum, count) => sum + count, 0)
    : value;
}

interface EventCountryFieldData {
  organizer: PerCountry<string>;
  contactEmail: PerCountry<string>;
  maxParticipants: PerCountry<number>;
  freePlaces?: PerCountry<number> | null;
}

/**
 * An event's per-country fields for one country — the single rule the form
 * and the mails resolve them by. Without a country (or one the event has no
 * value for) the texts name every country's value and the limit is the
 * event's total; the free places stay unresolved, since a waiting list must
 * not be decided by another country's count.
 */
export function eventCountryFields(
  event: EventCountryFieldData,
  country: string | null,
) {
  return {
    organizer:
      forCountry(event.organizer, country) ??
      allCountryValues(event.organizer).filter(Boolean).join(' / '),
    contactEmail:
      forCountry(event.contactEmail, country) ??
      allCountryValues(event.contactEmail).filter(Boolean).join(', '),
    // Without a country the limit is the event's — the total, even where every
    // country happens to have the same one.
    maxParticipants:
      (country ? forCountry(event.maxParticipants, country) : undefined) ??
      sumCountryValues(event.maxParticipants),
    freePlaces: forCountry(event.freePlaces, country) ?? null,
  };
}
