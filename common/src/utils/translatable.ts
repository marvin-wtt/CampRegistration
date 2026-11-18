import type { PerGroup, Translatable } from '../entities/index.js';
import { COUNTRY_LOCALES, type AppLocale } from '../locales.js';

function isRecord<T>(value: T | Record<string, T>): value is Record<string, T> {
  return typeof value === 'object' && value !== null;
}

// Event texts are keyed by country (`gb`), others by language (`en`): a
// locale matches both, its own country before others speaking its language.
function localeKeys(locale: string): string[] {
  const normalized = locale.toLowerCase();
  const [language, region] = normalized.split('-');

  if (!language) {
    return [];
  }

  const countries = Object.keys(COUNTRY_LOCALES).filter(
    (country) => COUNTRY_LOCALES[country] === language,
  );
  // The locale can itself be a country code (`cz` → `cs`).
  const ownLocale = COUNTRY_LOCALES[language] as AppLocale | undefined;

  return [
    normalized,
    language,
    ...(ownLocale ? [ownLocale] : []),
    ...(region ? [region] : []),
    ...countries,
  ];
}

const isPresent = <T>(entry: T | undefined): entry is T =>
  entry !== undefined && entry !== null && entry !== '';

/**
 * A `Translatable` in one locale: the locale, its language and the countries
 * writing it, then the same for the fallback locale, then any value. Empty
 * entries count as missing.
 */
export function translate<T>(
  value: Translatable<T> | null | undefined,
  locale: string,
  fallbackLocale = 'en',
): T | undefined {
  if (value === null || value === undefined || !isRecord(value)) {
    return value ?? undefined;
  }

  const entries = new Map(
    Object.entries(value).map(([key, entry]) => [key.toLowerCase(), entry]),
  );
  for (const key of [...localeKeys(locale), ...localeKeys(fallbackLocale)]) {
    const entry = entries.get(key);
    if (isPresent(entry)) {
      return entry;
    }
  }

  return Object.values(value).find(isPresent);
}

/**
 * A `PerGroup` value for one group. Without a group only a value that is the
 * same in every group resolves: guessing another group's limit or contact
 * would be wrong rather than incomplete.
 */
export function forGroup<T>(
  value: PerGroup<T> | null | undefined,
  group: string | null | undefined,
): T | undefined {
  if (value === null || value === undefined || !isRecord(value)) {
    return value ?? undefined;
  }

  if (group) {
    return value[group.toLowerCase()];
  }

  const values = allGroupValues(value);
  return values.length === 1 ? values[0] : undefined;
}

/**
 * The group a registration belongs to: the one it selected, or the event's
 * only one. A selection the event doesn't run counts as none — no per-group
 * value or template exists for it. An event's groups are its countries.
 */
export function eventGroup(
  event: { countries: readonly string[] },
  selected: string | null | undefined,
): string | null {
  const groups = event.countries.map((group) => group.toLowerCase());
  const group = selected?.toLowerCase();

  if (group && groups.includes(group)) {
    return group;
  }

  return groups.length === 1 ? groups[0] : null;
}

/** `fn` applied to the one value, or to each group's. */
export function mapPerGroup<T, U>(
  value: PerGroup<T>,
  fn: (value: T) => U,
): PerGroup<U> {
  if (!isRecord(value)) {
    return fn(value);
  }

  return Object.fromEntries(
    Object.entries(value).map(([group, entry]) => [group, fn(entry)]),
  );
}

/** Every group's distinct value, for when no single group applies. */
export function allGroupValues<T>(value: PerGroup<T>): T[] {
  return isRecord(value) ? [...new Set(Object.values(value))] : [value];
}

/** The sum over every group, e.g. an event's total participant limit. */
export function sumGroupValues(value: PerGroup<number>): number {
  return isRecord(value)
    ? Object.values(value).reduce((sum, count) => sum + count, 0)
    : value;
}

export interface EventGroupFieldData {
  organizer: PerGroup<string>;
  contactEmail: PerGroup<string>;
  maxParticipants: PerGroup<number>;
  freePlaces?: PerGroup<number> | null;
}

/**
 * An event's per-group fields for one group — the single rule the form and
 * the mails resolve them by. Without a group (or one the event has no value
 * for) the texts name every group's value and the limit is the event's total;
 * the free places stay unresolved, since a waiting list must not be decided
 * by another group's count.
 */
export function eventGroupFields(
  event: EventGroupFieldData,
  group: string | null,
) {
  return {
    organizer:
      forGroup(event.organizer, group) ??
      allGroupValues(event.organizer).filter(Boolean).join(' / '),
    contactEmail:
      forGroup(event.contactEmail, group) ??
      allGroupValues(event.contactEmail).filter(Boolean).join(', '),
    // Without a group the limit is the event's — the total, even where every
    // group happens to have the same one.
    maxParticipants:
      (group ? forGroup(event.maxParticipants, group) : undefined) ??
      sumGroupValues(event.maxParticipants),
    freePlaces: forGroup(event.freePlaces, group) ?? null,
  };
}
