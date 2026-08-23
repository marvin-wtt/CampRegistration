import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
  type Ref,
  type WatchSource,
} from 'vue';
import type { CursorPaginated } from '@camp-registration/common/entities';
import {
  useErrorExtractor,
  useServiceNotifications,
} from '@/composables/serviceHandler';

export interface ServerListQueryContext {
  /** Cursor for the next chunk; `undefined` on the first (reset) load. */
  cursor: string | undefined;
  limit: number;
  sortBy: string | undefined;
  sortType: 'asc' | 'desc';
  search: string;
}

export interface UseServerListOptions<TRow, TQuery> {
  /** Fetches a chunk of rows plus the cursor metadata from the server. */
  fetch: (query: TQuery) => Promise<CursorPaginated<TRow>>;
  /** Maps the current cursor/sort/search state to the service query. */
  buildQuery: (ctx: ServerListQueryContext) => TQuery;
  /** Extra reactive sources (e.g. facet filters) that reset the list on change. */
  watchSources?: WatchSource<unknown> | WatchSource<unknown>[];
  /** Rows fetched per chunk while scrolling. */
  pageSize?: number;
  sortBy?: string | null;
  descending?: boolean;
  /** Store name for the mutation progress notifications. */
  storeName?: string;
  /** Runs on `nextTick` after a reset load resolved — scroll the view back to the top. */
  onReset?: () => void;
}

/**
 * Drives an infinitely-scrolling, cursor-paginated list: it owns the accumulated
 * rows and the sort/search state, and appends the next chunk on demand. Sorting,
 * searching and facet filters round-trip to the server and reset the list.
 * Cursor keyset paging keeps results stable even while rows are inserted or
 * removed underneath.
 *
 * View-agnostic — `useServerTable` adapts it to QTable, and `CampGrid` drives it
 * from a QVirtualScroll of card rows.
 */
export function useServerList<TRow, TQuery>(
  options: UseServerListOptions<TRow, TQuery>,
) {
  const { extractErrorText } = useErrorExtractor();
  const notifications = useServiceNotifications(options.storeName);

  const pageSize = options.pageSize ?? 50;

  const rows = ref<TRow[]>([]) as Ref<TRow[]>;
  // Nullable because Quasar's `clearable` inputs emit null, and this ref is
  // bound straight to one.
  const search = ref<string | null>('');
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const total = ref<number>(0);
  const nextCursor = ref<string | null>(null);

  const sortBy = ref<string | null>(options.sortBy ?? null);
  const descending = ref<boolean>(options.descending ?? true);

  // Bumped on every load; lets a resolving request detect that a newer one has
  // superseded it (the user kept typing) and skip applying its stale result.
  let requestToken = 0;

  const hasMore = computed<boolean>(() => nextCursor.value !== null);
  /** First load, with nothing on screen yet — show skeletons rather than a spinner. */
  const initialLoading = computed<boolean>(
    () => loading.value && rows.value.length === 0,
  );
  /** Appending onto an already-rendered list. */
  const loadingMore = computed<boolean>(
    () => loading.value && rows.value.length > 0,
  );

  async function load(cursor: string | undefined): Promise<void> {
    const append = cursor !== undefined;
    const token = ++requestToken;

    loading.value = true;
    if (!append) {
      error.value = null;
    }

    try {
      const query = options.buildQuery({
        cursor,
        limit: pageSize,
        sortBy: sortBy.value ?? undefined,
        sortType: descending.value ? 'desc' : 'asc',
        search: search.value?.trim() ?? '',
      });

      const { data, meta } = await options.fetch(query);

      if (token !== requestToken) {
        return;
      }

      nextCursor.value = meta.nextCursor;
      if (meta.total !== undefined) {
        total.value = meta.total;
      }
      rows.value = append ? [...rows.value, ...data] : data;
    } catch (err: unknown) {
      if (token !== requestToken) {
        return;
      }

      error.value = extractErrorText(err);
      if (!append) {
        rows.value = [];
        total.value = 0;
      }
    } finally {
      if (token === requestToken) {
        loading.value = false;
      }
    }
  }

  /** Reload from the first chunk (search, sort or filter change, or after a mutation). */
  function reload(): void {
    void load(undefined).then(() => void nextTick(() => options.onReset?.()));
  }

  function loadMore(): Promise<void> {
    if (loading.value || nextCursor.value === null) {
      return Promise.resolve();
    }

    return load(nextCursor.value);
  }

  onMounted(reload);

  const sources = options.watchSources
    ? Array.isArray(options.watchSources)
      ? options.watchSources
      : [options.watchSources]
    : [];

  watch([search, sortBy, descending, ...sources], () => reload());

  return {
    rows,
    search,
    sortBy,
    descending,
    loading,
    initialLoading,
    loadingMore,
    error,
    total,
    hasMore,
    reload,
    loadMore,
    ...notifications,
  };
}
