import type { Event } from '@camp-registration/common/entities';

export interface AvailabilityEntry {
  countries: string[];
  free: number;
  max: number | null;
}

type AvailabilityEvent = Pick<
  Event,
  'countries' | 'freePlaces' | 'maxParticipants'
>;

/**
 * Free places per group, or one entry for the whole event when its limit is
 * shared. `null` when the event doesn't publish its free places.
 */
export function eventAvailability(
  event: AvailabilityEvent,
): AvailabilityEntry[] | null {
  const free = event.freePlaces;
  if (free == null) {
    return null;
  }
  const max = event.maxParticipants;

  // Single total — one row carrying all event flags
  if (typeof free === 'number') {
    const maxTotal =
      typeof max === 'number'
        ? max
        : Object.values(max ?? {}).reduce<number>(
            (sum, v) => sum + (v ?? 0),
            0,
          );

    return [
      {
        countries: event.countries,
        free,
        max: maxTotal > 0 ? maxTotal : null,
      },
    ];
  }

  // Per-country record — one row per country
  const entries = event.countries.flatMap<AvailabilityEntry>((country) => {
    const countryFree = free[country];
    if (countryFree === undefined) {
      return [];
    }
    const countryMax =
      typeof max === 'number' ? null : (max?.[country] ?? null);

    return [
      {
        countries: [country],
        free: countryFree,
        max: countryMax != null && countryMax > 0 ? countryMax : null,
      },
    ];
  });

  return entries.length > 0 ? entries : null;
}
