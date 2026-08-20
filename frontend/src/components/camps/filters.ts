import type { CampQuery } from '@camp-registration/common/entities';

/** The countries a camp can be authored for — mirrors the camp editor's list. */
export const CAMP_COUNTRIES: string[] = ['de', 'fr', 'gb', 'pl', 'cz'];

/**
 * Sorting is offered as single opaque values rather than a field/direction pair,
 * so the select stays one control and the URL carries one parameter.
 *
 * `name` is deliberately absent: it is a JSON column, so ordering by it sorts the
 * serialized translation object, not the string the visitor reads.
 */
export const CAMP_SORT_OPTIONS = [
  'start_asc',
  'start_desc',
  'price_asc',
  'price_desc',
] as const;

export type CampSortOption = (typeof CAMP_SORT_OPTIONS)[number];

export const DEFAULT_CAMP_SORT: CampSortOption = 'start_asc';

interface SortOrder {
  sortBy: NonNullable<CampQuery['sortBy']>;
  descending: boolean;
}

const SORT_ORDERS: Record<CampSortOption, SortOrder> = {
  start_asc: { sortBy: 'startAt', descending: false },
  start_desc: { sortBy: 'startAt', descending: true },
  price_asc: { sortBy: 'price', descending: false },
  price_desc: { sortBy: 'price', descending: true },
};

export function sortOrderOf(option: CampSortOption): SortOrder {
  return SORT_ORDERS[option];
}

export function sortOptionOf(
  sortBy: string | null,
  descending: boolean,
): CampSortOption {
  const match = CAMP_SORT_OPTIONS.find((option) => {
    const order = SORT_ORDERS[option];

    return order.sortBy === sortBy && order.descending === descending;
  });

  return match ?? DEFAULT_CAMP_SORT;
}

/**
 * Ready-made date windows. Visitors think in seasons rather than in exact days,
 * and the backend filter is "the camp falls entirely inside the window", which
 * these map onto directly.
 */
export const CAMP_DATE_PRESETS = [
  'this_month',
  'next_3_months',
  'summer',
] as const;

export type CampDatePreset = (typeof CAMP_DATE_PRESETS)[number];

export interface CampDateRange {
  startAt: string;
  endAt: string;
}

/** Local midnight, serialized the way DateRangeInput serializes a picked day. */
function startOfDay(year: number, month: number, day: number): string {
  return new Date(year, month, day, 0, 0).toISOString();
}

/** Local end of day, matching DateRangeInput's `default-end-time`. */
function endOfDay(year: number, month: number, day: number): string {
  return new Date(year, month, day, 23, 59).toISOString();
}

/** `YYYY-MM-DD` as QDate hands it over → the two instants the query filters on. */
export function dayRangeToIso(from: string, to: string): CampDateRange {
  const [fromYear = 0, fromMonth = 1, fromDay = 1] = from
    .split('-')
    .map(Number);
  const [toYear = 0, toMonth = 1, toDay = 1] = to.split('-').map(Number);

  return {
    startAt: startOfDay(fromYear, fromMonth - 1, fromDay),
    endAt: endOfDay(toYear, toMonth - 1, toDay),
  };
}

/** The inverse, so an ISO range can seed the picker. */
export function isoToDay(iso: string): string {
  const date = new Date(iso);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function datePresetRange(
  preset: CampDatePreset,
  now: Date = new Date(),
): CampDateRange {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  // A camp that has already started can no longer be joined, so every window
  // opens today rather than at the start of the period.
  const from = startOfDay(year, month, day);

  switch (preset) {
    case 'this_month':
      // Day 0 of the next month is the last day of this one.
      return { startAt: from, endAt: endOfDay(year, month + 1, 0) };
    case 'next_3_months':
      return { startAt: from, endAt: endOfDay(year, month + 3, day) };
    case 'summer': {
      // June–August, rolling over to next year once this summer has passed.
      const summerYear = month > 7 ? year + 1 : year;
      const summerStart = startOfDay(summerYear, 5, 1);

      return {
        startAt: summerStart > from ? summerStart : from,
        endAt: endOfDay(summerYear, 7, 31),
      };
    }
  }
}

function sameDay(a: string | undefined, b: string): boolean {
  return (
    a !== undefined && new Date(a).toDateString() === new Date(b).toDateString()
  );
}

/** Which preset — if any — the current range spells out, so a chip can show it. */
export function matchingDatePreset(
  startAt: string | undefined,
  endAt: string | undefined,
  now: Date = new Date(),
): CampDatePreset | undefined {
  return CAMP_DATE_PRESETS.find((preset) => {
    const range = datePresetRange(preset, now);

    return sameDay(startAt, range.startAt) && sameDay(endAt, range.endAt);
  });
}
