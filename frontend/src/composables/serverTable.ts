import { nextTick, ref, watch, type Component } from 'vue';
import type { QTable } from 'quasar';
import {
  useServerList,
  type ServerListQueryContext,
  type UseServerListOptions,
} from '@/composables/serverList';

export interface ServerTablePagination {
  sortBy: string | null;
  descending: boolean;
  rowsPerPage: number;
}

export type ServerTableQueryContext = ServerListQueryContext;

export type UseServerTableOptions<TRow, TQuery> = Omit<
  UseServerListOptions<TRow, TQuery>,
  'onReset'
>;

/** The QVirtualScroll handle passed on QTable's `@virtual-scroll` event. */
interface VirtualScrollRef {
  refresh: (index?: number) => void;
}

/** Subset of the `@virtual-scroll` event payload we rely on (Quasar types `ref` as Component). */
interface VirtualScrollDetails {
  to: number;
  ref: Component;
}

/**
 * Adapts `useServerList` to a Quasar QTable, following the official "dynamic
 * loading / virtual scroll" pattern: the table renders every loaded row and the
 * next chunk is appended when the user scrolls onto the last one
 * (`@virtual-scroll`), refreshing the virtual scroller afterwards.
 *
 * Bind the returned `tableRef` to the QTable's `ref` and set
 * `:virtual-scroll-sticky-size-start` to the sticky header height.
 */
export function useServerTable<TRow, TQuery>(
  options: UseServerTableOptions<TRow, TQuery>,
) {
  const tableRef = ref<QTable>();

  const list = useServerList<TRow, TQuery>({
    ...options,
    // Reset the virtual scroller to the top now that the row set was replaced.
    onReset: () => tableRef.value?.scrollTo(0),
  });

  // rowsPerPage: 0 tells QTable to render every loaded row (virtual scroll keeps
  // the DOM light); we handle "load more" ourselves via @virtual-scroll.
  const pagination = ref<ServerTablePagination>({
    sortBy: options.sortBy ?? null,
    descending: options.descending ?? true,
    rowsPerPage: 0,
  });

  // QTable owns the header sort state; mirror it onto the list, which reloads.
  watch(
    () => [pagination.value.sortBy, pagination.value.descending] as const,
    ([sortBy, descending]) => {
      list.sortBy.value = sortBy;
      list.descending.value = descending;
    },
  );

  function onVirtualScroll(details: VirtualScrollDetails): void {
    if (details.to < list.rows.value.length - 1) {
      return;
    }

    void list.loadMore().then(() => {
      // Let the virtual scroller recompute sizes/positions for the new chunk.
      void nextTick(() =>
        (details.ref as unknown as VirtualScrollRef).refresh(),
      );
    });
  }

  // The server returns rows already ordered; keep QTable from re-sorting the
  // partial, loaded subset while still tracking the header sort state.
  function identitySort(input: readonly TRow[]): readonly TRow[] {
    return input;
  }

  return {
    ...list,
    tableRef,
    pagination,
    onVirtualScroll,
    identitySort,
  };
}
