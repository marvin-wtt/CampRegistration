import { computed } from 'vue';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';

const ORDERS = ['asc', 'desc'] as const;

/**
 * A list's sort and direction in the query (`sort`, `order`), so a reload
 * keeps them. Each sort has its natural direction; picking another sort
 * returns to it, and the defaults stay out of the URL.
 */
export function useQuerySort<const T extends string>(
  sorts: readonly T[],
  fallback: T,
  naturallyDescending: (sort: T) => boolean,
) {
  const { getEnumQueryParam, setQueryParams } = useRouteQueryParams();

  const sort = computed<T>({
    get: () => getEnumQueryParam('sort', sorts) ?? fallback,
    set: (value) =>
      setQueryParams({ sort: value === fallback ? null : value, order: null }),
  });

  const descending = computed<boolean>({
    get: () => {
      const order = getEnumQueryParam('order', ORDERS);
      return order ? order === 'desc' : naturallyDescending(sort.value);
    },
    set: (value) => {
      const order = value ? 'desc' : 'asc';
      setQueryParams({
        order: value === naturallyDescending(sort.value) ? null : order,
      });
    },
  });

  return { sort, descending };
}
