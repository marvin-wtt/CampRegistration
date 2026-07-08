import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
  type Component,
  type Ref,
} from 'vue';
import type { QTable } from 'quasar';
import type { CursorPaginated } from '@camp-registration/common/entities';
import {
  useErrorExtractor,
  useServiceNotifications,
} from '@/composables/serviceHandler';

export interface ServerTablePagination {
  sortBy: string | null;
  descending: boolean;
  rowsPerPage: number;
}

export interface ServerTableQueryContext {
  /** Cursor for the next chunk; `undefined` on the first (reset) load. */
  cursor: string | undefined;
  limit: number;
  sortBy: string | undefined;
  sortType: 'asc' | 'desc';
  search: string;
}

/** The QVirtualScroll handle passed on QTable's `@virtual-scroll` event. */
interface VirtualScrollRef {
  refresh: (index?: number) => void;
}

/** Subset of the `@virtual-scroll` event payload we rely on (Quasar types `ref` as Component). */
interface VirtualScrollDetails {
  to: number;
  ref: Component;
}

export interface UseServerTableOptions<TRow, TQuery> {
  /** Fetches a chunk of rows plus the cursor metadata from the server. */
  fetch: (query: TQuery) => Promise<CursorPaginated<TRow>>;
  /** Maps the current cursor/sort/search state to the service query. */
  buildQuery: (ctx: ServerTableQueryContext) => TQuery;
  /** Extra reactive sources (e.g. facet filters) that reset the list on change. */
  watchSources?: Ref<unknown> | Ref<unknown>[];
  /** Rows fetched per chunk while scrolling. */
  pageSize?: number;
  sortBy?: string | null;
  descending?: boolean;
  /** Store name for the mutation progress notifications. */
  storeName?: string;
}

/**
 * Drives a Quasar QTable as an infinitely-scrolling, cursor-paginated list,
 * following the official "dynamic loading / virtual scroll" pattern: it owns the
 * accumulated rows and the sort/search state, and appends the next chunk when the
 * user scrolls onto the last row (`@virtual-scroll`), refreshing the virtual
 * scroller afterwards. Sorting, searching and facet filters round-trip to the
 * server and reset the list to the top. Cursor keyset paging keeps results stable
 * even while rows are inserted/removed underneath.
 *
 * Bind the returned `tableRef` to the QTable's `ref` and set
 * `:virtual-scroll-sticky-size-start` to the sticky header height.
 */
export function useServerTable<TRow, TQuery>(
  options: UseServerTableOptions<TRow, TQuery>,
) {
  const { extractErrorText } = useErrorExtractor();
  const notifications = useServiceNotifications(options.storeName);

  const pageSize = options.pageSize ?? 50;

  const tableRef = ref<QTable>();
  const rows = ref<TRow[]>([]) as Ref<TRow[]>;
  const search = ref<string>('');
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const total = ref<number>(0);
  const nextCursor = ref<string | null>(null);

  // rowsPerPage: 0 tells QTable to render every loaded row (virtual scroll keeps
  // the DOM light); we handle "load more" ourselves via @virtual-scroll.
  const pagination = ref<ServerTablePagination>({
    sortBy: options.sortBy ?? null,
    descending: options.descending ?? true,
    rowsPerPage: 0,
  });

  const hasMore = computed<boolean>(() => nextCursor.value !== null);

  async function load(cursor: string | undefined): Promise<void> {
    const append = cursor !== undefined;
    loading.value = true;
    if (!append) {
      error.value = null;
    }

    try {
      const query = options.buildQuery({
        cursor,
        limit: pageSize,
        sortBy: pagination.value.sortBy ?? undefined,
        sortType: pagination.value.descending ? 'desc' : 'asc',
        search: search.value.trim(),
      });

      const { data, meta } = await options.fetch(query);

      nextCursor.value = meta.nextCursor;
      if (meta.total !== undefined) {
        total.value = meta.total;
      }
      rows.value = append ? [...rows.value, ...data] : data;
    } catch (err: unknown) {
      error.value = extractErrorText(err);
      if (!append) {
        rows.value = [];
      }
    } finally {
      loading.value = false;
    }
  }

  /** Reload from the first chunk (search, sort or filter change, or after a mutation). */
  function reload(): void {
    void load(undefined).then(() => {
      // Reset the virtual scroller to the top now that the row set was replaced.
      void nextTick(() => tableRef.value?.scrollTo(0));
    });
  }

  function loadMore(scrollRef?: VirtualScrollRef): void {
    if (loading.value || nextCursor.value === null) {
      return;
    }

    void load(nextCursor.value).then(() => {
      // Let the virtual scroller recompute sizes/positions for the new chunk.
      if (scrollRef) {
        void nextTick(() => scrollRef.refresh());
      }
    });
  }

  function onVirtualScroll(details: VirtualScrollDetails): void {
    if (details.to === rows.value.length - 1) {
      loadMore(details.ref as unknown as VirtualScrollRef);
    }
  }

  // The server returns rows already ordered; keep QTable from re-sorting the
  // partial, loaded subset while still tracking the header sort state.
  function identitySort(input: readonly TRow[]): readonly TRow[] {
    return input;
  }

  onMounted(reload);

  const sources = options.watchSources
    ? Array.isArray(options.watchSources)
      ? options.watchSources
      : [options.watchSources]
    : [];

  watch(
    [
      search,
      () => pagination.value.sortBy,
      () => pagination.value.descending,
      ...sources,
    ],
    () => reload(),
  );

  return {
    tableRef,
    rows,
    search,
    loading,
    error,
    total,
    pagination,
    hasMore,
    onVirtualScroll,
    identitySort,
    reload,
    ...notifications,
  };
}
