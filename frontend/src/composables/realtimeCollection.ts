import { onScopeDispose } from 'vue';
import type { Ref } from 'vue';
import { useRoute } from 'vue-router';
import type {
  RealtimeEvent,
  RealtimeResource,
} from '@camp-registration/common/realtime';
import { useRealtimeStore } from '@/stores/realtime-store';
import { isAPIServiceError } from '@/services/APIService';

export interface RealtimeCollectionOptions<T extends { id: string }> {
  /** The list state to reconcile (usually `data` from `useServiceHandler`). */
  data: Ref<T[] | undefined>;
  /** Mark the list stale without fetching (list not currently loaded). */
  invalidate: () => void;
  /** Invalidate and refetch the full list. */
  reload: () => Promise<void> | void;
  /**
   * Fetch a single entity by id. When omitted the collection runs in "list
   * mode": every event collapses into one debounced `reload()` (for resources
   * without a per-id endpoint, or where bursts of individual events are
   * expected — e.g. table template syncs).
   */
  fetchOne?: (campId: string, id: string) => Promise<T>;
  /** Debounce for collection-level reloads. */
  debounceMs?: number;
  /** Optional hooks, e.g. to forward changes onto a feature bus. */
  onCreate?: (item: T) => void;
  onUpdate?: (item: T) => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_DEBOUNCE_MS = 300;

interface PendingItemFetch {
  /** Another event for this id arrived while the fetch was in flight. */
  rerun: boolean;
  /** The entity was deleted while the fetch was in flight — drop the result. */
  cancelled: boolean;
}

/**
 * Applies realtime invalidation events for `resource` to a list of entities,
 * implementing the shared conflict/performance handling in one place:
 *
 * - list not loaded → `invalidate()` only (never build partial lists);
 * - `deleted` → remove locally (and drop any in-flight refetch of that id);
 * - `created`/`updated` → refetch the single entity and upsert it. Concurrent
 *   events for the same id coalesce into at most one trailing refetch, and
 *   responses apply in order — a slow stale response can never override a
 *   newer one;
 * - `invalidated` (bulk server ops) or list mode → one debounced full reload;
 *   a reload bumps a generation counter that voids any in-flight item fetches,
 *   so an old item response can't clobber the fresh list;
 * - stream reconnect → full reload (to catch events missed while offline),
 *   only if the list is loaded;
 * - camp switch → an item fetch's result is only applied if the active camp
 *   at completion still matches the camp it was fetched for, so a slow
 *   response started under a previous camp (store-level consumers persist
 *   across navigation) can't be appended into the new camp's list.
 *
 * Works inside Pinia setup stores and page components alike: cleanup is
 * registered with `onScopeDispose`, so page-level usage unsubscribes on
 * unmount while store-level usage lives as long as the store.
 */
export function useRealtimeCollection<T extends { id: string }>(
  resource: RealtimeResource,
  options: RealtimeCollectionOptions<T>,
): void {
  const route = useRoute();
  const realtime = useRealtimeStore();

  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  const itemFetches = new Map<string, PendingItemFetch>();
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  let reloading = false;
  let reloadQueued = false;
  // Bumped by every full reload; item fetches started under an older
  // generation discard their result.
  let generation = 0;

  const activeCampId = (): string | undefined => {
    const value = route.params.campId;
    return Array.isArray(value) ? value[0] : value;
  };

  function upsert(item: T) {
    const list = options.data.value;
    if (list === undefined) {
      return;
    }
    if (list.some((entry) => entry.id === item.id)) {
      options.data.value = list.map((entry) =>
        entry.id === item.id ? item : entry,
      );
      options.onUpdate?.(item);
    } else {
      options.data.value = [...list, item];
      options.onCreate?.(item);
    }
  }

  function remove(id: string) {
    const list = options.data.value;
    if (list === undefined || !list.some((entry) => entry.id === id)) {
      return;
    }
    options.data.value = list.filter((entry) => entry.id !== id);
    options.onDelete?.(id);
  }

  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => void runReload(), debounceMs);
  }

  async function runReload() {
    if (reloading) {
      // Serialize: run once more after the in-flight reload finishes.
      reloadQueued = true;
      return;
    }
    reloading = true;
    generation++;
    try {
      await options.reload();
    } catch {
      // The next event or explicit fetch recovers; state stays marked stale.
    } finally {
      reloading = false;
      if (reloadQueued) {
        reloadQueued = false;
        void runReload();
      }
    }
  }

  async function fetchItem(campId: string, id: string) {
    const pending = itemFetches.get(id);
    if (pending) {
      // Coalesce: one trailing refetch replays all events that arrived while
      // this one was in flight.
      pending.rerun = true;
      return;
    }

    const state: PendingItemFetch = { rerun: false, cancelled: false };
    itemFetches.set(id, state);
    const startGeneration = generation;

    try {
      const item = await options.fetchOne!(campId, id);
      // Stale guards: a full reload happened meanwhile (fresher than this
      // response), the entity was deleted, or — since store-level consumers
      // persist across navigation and may swap `data.value` for a different
      // camp via their own invalidation path (e.g. campBus on route change) —
      // the active camp itself has moved on from the one this fetch was for.
      if (
        generation === startGeneration &&
        !state.cancelled &&
        activeCampId() === campId
      ) {
        upsert(item);
      }
    } catch (error: unknown) {
      // Deleted between the event and our refetch — drop it locally.
      if (isAPIServiceError(error) && error.response?.status === 404) {
        remove(id);
        state.rerun = false;
      } else {
        // Transient failure: mark stale so the next explicit fetch recovers.
        // No automatic retry — a rerun only happens for a genuinely new event.
        options.invalidate();
      }
    } finally {
      itemFetches.delete(id);
      if (
        state.rerun &&
        !state.cancelled &&
        generation === startGeneration &&
        activeCampId() === campId
      ) {
        void fetchItem(campId, id);
      }
    }
  }

  function handleEvent(event: RealtimeEvent) {
    const campId = activeCampId();
    if (!campId) {
      return;
    }

    // List not loaded on the current page — just mark stale so the next page
    // that needs it fetches fresh, rather than building a partial list.
    if (options.data.value === undefined) {
      options.invalidate();
      return;
    }

    if (event.operation === 'deleted' && event.id !== null) {
      const pending = itemFetches.get(event.id);
      if (pending) {
        pending.cancelled = true;
        pending.rerun = false;
      }
      remove(event.id);
      return;
    }

    // Collection-level invalidation, or no per-id endpoint: one debounced
    // full reload absorbs event bursts.
    if (
      event.operation === 'invalidated' ||
      event.id === null ||
      !options.fetchOne
    ) {
      scheduleReload();
      return;
    }

    void fetchItem(campId, event.id);
  }

  const unsubscribers = [
    realtime.on(resource, handleEvent),
    realtime.onReconnect(resource, () => {
      // Catch up on events missed while disconnected — but only if the list
      // is in use; otherwise leave it stale.
      if (options.data.value !== undefined) {
        void runReload();
      } else {
        options.invalidate();
      }
    }),
  ];

  onScopeDispose(() => {
    clearTimeout(reloadTimer);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  });
}
