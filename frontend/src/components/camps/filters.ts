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
