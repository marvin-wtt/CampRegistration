import type { Event } from '@camp-registration/common/entities';

export interface AvailabilityEntry {
  groups: string[];
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
        groups: event.countries,
        free,
        max: maxTotal > 0 ? maxTotal : null,
      },
    ];
  }

  // Per-group record — one row per group
  const entries = event.countries.flatMap<AvailabilityEntry>((group) => {
    const groupFree = free[group];
    if (groupFree === undefined) {
      return [];
    }
    const groupMax = typeof max === 'number' ? null : (max?.[group] ?? null);

    return [
      {
        groups: [group],
        free: groupFree,
        max: groupMax != null && groupMax > 0 ? groupMax : null,
      },
    ];
  });

  return entries.length > 0 ? entries : null;
}

/**
 * One group's free places. `null` when the event shares one limit across its
 * groups or doesn't publish its free places.
 */
export function groupFreePlaces(
  event: AvailabilityEvent,
  group: string,
): number | null {
  const availability = eventAvailability(event);
  if (availability === null || availability.length < 2) {
    return null;
  }

  return (
    availability.find((entry) => entry.groups.includes(group))?.free ?? null
  );
}
