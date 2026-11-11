import {
  computed,
  getCurrentScope,
  onScopeDispose,
  readonly,
  ref,
  shallowRef,
  toRaw,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import type { RealtimeResource } from '@camp-registration/common/realtime';
import { useAuthBus } from '@/composables/bus';
import { isAPIServiceError } from '@/services/APIService';
import { useErrorExtractor } from '@/composables/errorText';
import { useAction } from '@/composables/action';
import type { ActionOptions, ReportProgress } from '@/composables/action';
import {
  useRealtimeCollection,
  type RealtimeCollectionOptions,
} from '@/composables/realtimeCollection';

/** Unscoped resources (e.g. the user's own organizations) use this key. */
const GLOBAL_KEY = 'global';

// Statuses where the server refused the whole request and changed nothing.
const REFUSED_STATUSES = new Set([400, 403, 422]);

function mayHaveApplied(err: unknown, multiWrite: boolean): boolean {
  if (multiWrite || !isAPIServiceError(err) || !err.response) {
    return true;
  }
  return !REFUSED_STATUSES.has(err.response.status);
}

export interface ResourceOptions<T> {
  /** Words the toasts as `stores.<name>.*`; a page leaves it out. */
  name?: string;
  /**
   * Whose data this is — usually a route param such as the event id. Read
   * when loading and when a write starts; `undefined` means none is open.
   * Leave it out for data that belongs to no scope.
   */
  key?: () => string | undefined;
  fetch: (key: string) => Promise<T>;
}

export interface MutateOptions<T, R> extends ActionOptions {
  /** Folds a successful result into the data. */
  apply?: (current: T, result: R) => T;
  /** Shown right away; undone if the write fails. */
  optimistic?: (current: T) => T;
  /**
   * Takes the optimistic change back out when the data changed meanwhile
   * (e.g. drops a placeholder by id). Without it, a reload undoes it.
   */
  rollback?: (current: T) => T;
  /** Overrides the scope the write targets; defaults to the current key. */
  key?: string;
  /**
   * Reloads after a successful write, for one whose effect the result doesn't
   * show (bulk changes, data the server derives). The call resolves after it.
   */
  reload?: boolean;
  /**
   * The request makes several writes, so even a refused one may have left
   * some applied: it reloads after any failure.
   */
  multiWrite?: boolean;
}

/**
 * Data loaded from the API for one scope, with its loading state. The data
 * can only be changed through `mutate` and `update`, so every write reports
 * its failure, resyncs, and lands only in the data of the scope it was meant
 * for — never in another event's that was opened meanwhile.
 */
export function useResource<T>(options: ResourceOptions<T>) {
  return createResource(options).resource;
}

function createResource<T>(options: ResourceOptions<T>) {
  const { t } = useI18n({ useScope: 'global' });
  const { extractErrorText } = useErrorExtractor();
  const { run } = useAction(options.name);

  const data = ref<T>();
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const pendingCount = ref<number>(0);
  // The scope the data belongs to; set when a load for it starts.
  const loadedKey = shallowRef<string>();
  let stale = true;
  // Loads and reloads; a write landing during one has to fetch again.
  let fetchesInFlight = 0;
  // Bumped by every load; a response that isn't the latest is dropped.
  let token = 0;

  const authBus = useAuthBus();
  authBus.on('logout', reset);
  // A page's resource goes with the page; a store's lives with the app.
  if (getCurrentScope()) {
    onScopeDispose(() => authBus.off('logout', reset));
  }

  // Live changes only arrive while the scope is open, so data kept from a
  // scope that was left is refetched when it's opened again.
  if (options.key) {
    watch(options.key, (key) => {
      if (key !== loadedKey.value) {
        stale = true;
      }
    });
  }

  function currentKey(): string | undefined {
    return options.key ? options.key() : GLOBAL_KEY;
  }

  function isLoadedFor(key: string): boolean {
    return loadedKey.value === key && data.value !== undefined;
  }

  function untilLoaded(): Promise<void> {
    if (!isLoading.value) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const stop = watch(
        isLoading,
        (loading) => {
          if (!loading) {
            stop();
            resolve();
          }
        },
        { flush: 'sync' },
      );
    });
  }

  /**
   * Loads the data for `key` unless it is already loaded and fresh. A call
   * while that key is loading joins the load in flight.
   */
  async function load(key: string | undefined = currentKey()): Promise<void> {
    if (key === undefined) {
      error.value = t('service.invalidParams');
      return;
    }
    if (key === loadedKey.value && isLoading.value) {
      return untilLoaded();
    }
    if (key === loadedKey.value && !stale) {
      return;
    }

    const ticket = ++token;
    loadedKey.value = key;
    data.value = undefined;
    error.value = null;
    isLoading.value = true;
    fetchesInFlight++;
    try {
      const result = await options.fetch(key);
      if (ticket === token) {
        data.value = result;
        stale = false;
      }
    } catch (err: unknown) {
      if (ticket === token) {
        error.value = extractErrorText(err);
      }
    } finally {
      fetchesInFlight--;
      if (ticket === token) {
        isLoading.value = false;
      }
    }
    // A reload that superseded this load decides when it ends.
    if (loadedKey.value === key) {
      await untilLoaded();
    }
  }

  /**
   * Refetches the loaded data in the background, keeping what is shown until
   * the response arrives. Never rejects: a failure leaves the data stale.
   */
  async function reload(): Promise<void> {
    const key = loadedKey.value;
    if (key === undefined) {
      stale = true;
      return;
    }

    const ticket = ++token;
    // A reload superseding a first load inherits its loading state.
    const supersedesLoad = isLoading.value;
    fetchesInFlight++;
    pendingCount.value++;
    try {
      const result = await options.fetch(key);
      if (ticket === token) {
        data.value = result;
        error.value = null;
        stale = false;
      }
    } catch (err: unknown) {
      if (ticket === token) {
        stale = true;
        if (supersedesLoad) {
          error.value = extractErrorText(err);
        }
      }
    } finally {
      fetchesInFlight--;
      pendingCount.value--;
      if (supersedesLoad && ticket === token) {
        isLoading.value = false;
      }
    }
  }

  /** Marks the data stale, so the next `load` fetches it again. */
  function invalidate() {
    stale = true;
    // A response on its way predates the change; a reload replaces it.
    if (fetchesInFlight > 0) {
      void reload();
    }
  }

  function reset() {
    token++;
    loadedKey.value = undefined;
    data.value = undefined;
    error.value = null;
    isLoading.value = false;
    stale = true;
  }

  /**
   * Takes data obtained another way (e.g. the profile a login returns) as
   * loaded and fresh, replacing any load in flight.
   */
  function seed(value: T, key: string | undefined = currentKey()) {
    token++;
    loadedKey.value = key;
    data.value = value;
    error.value = null;
    isLoading.value = false;
    stale = key === undefined;
  }

  /** Changes the loaded data in place, e.g. for a change made elsewhere. */
  function update(fn: (current: T) => T) {
    if (data.value !== undefined) {
      data.value = fn(data.value);
    }
  }

  /**
   * Runs a write for the current scope. On failure the error is reported, the
   * data is reloaded unless the server refused the request outright — it may
   * have applied all, some or none of it — and the call rejects with the
   * error marked as reported, so follow-ups are skipped without anything
   * reporting it twice.
   */
  async function mutate<R>(
    operation: string,
    request: (key: string, report: ReportProgress) => Promise<R>,
    {
      apply,
      optimistic,
      rollback,
      key: explicitKey,
      reload: reloadAfter = false,
      multiWrite = false,
      ...action
    }: MutateOptions<T, R> = {},
  ): Promise<R> {
    const key = explicitKey ?? currentKey();
    if (key === undefined) {
      // Reported like any failed write, so no page swaps for an error state.
      return run(
        operation,
        () => Promise.reject(new Error(t('service.invalidParams'))),
        action,
      );
    }

    let previous: T | undefined;
    let shown: T | undefined;
    if (optimistic && isLoadedFor(key)) {
      previous = data.value;
      shown = optimistic(data.value as T);
      data.value = shown;
    }

    pendingCount.value++;
    try {
      const result = await run(
        operation,
        (report) => request(key, report),
        action,
      );
      if (apply && loadedKey.value === key) {
        if (data.value !== undefined) {
          data.value = apply(data.value, result);
        }
        // A fetch started before this write would bring back the old state;
        // a failed load left nothing to add to, so the whole data is fetched.
        if (!reloadAfter && (fetchesInFlight > 0 || data.value === undefined)) {
          void reload();
        }
      }
      if (reloadAfter && loadedKey.value === key) {
        await reload();
      }
      return result;
    } catch (err: unknown) {
      // Whether the optimistic change is still shown with nothing to undo it.
      let leftOver = false;
      if (shown !== undefined && loadedKey.value === key) {
        if (toRaw(data.value) === toRaw(shown)) {
          data.value = previous;
        } else if (rollback && data.value !== undefined) {
          data.value = rollback(data.value);
        } else {
          leftOver = true;
        }
      }
      if (
        loadedKey.value === key &&
        (leftOver || mayHaveApplied(err, multiWrite))
      ) {
        void reload();
      }
      throw err;
    } finally {
      pendingCount.value--;
    }
  }

  const resource = {
    data: computed(() => data.value),
    isLoading: readonly(isLoading),
    error: readonly(error),
    /** Whether a write or background reload is running. */
    pending: computed(() => pendingCount.value > 0),
    load,
    reload,
    invalidate,
    reset,
    seed,
    update,
    mutate,
  };

  // The writable state stays private; only useCollection's live updates use it.
  return { resource, internal: { data, loadedKey, currentKey } };
}

export type CollectionRealtimeOptions<Item extends { id: string }> = Omit<
  RealtimeCollectionOptions<Item>,
  'data' | 'invalidate' | 'reload' | 'key'
> & { resource: RealtimeResource };

export interface CollectionOptions<
  Item extends { id: string },
> extends ResourceOptions<Item[]> {
  /** Keeps the list in sync with changes other clients make. */
  realtime?: CollectionRealtimeOptions<Item>;
}

/** A list resource, optionally kept live by realtime events. */
export function useCollection<Item extends { id: string }>(
  options: CollectionOptions<Item>,
) {
  // An empty list may come back as nothing; a write then has a list to join.
  const { resource, internal } = createResource<Item[]>({
    ...options,
    fetch: async (key) => (await options.fetch(key)) ?? [],
  });

  if (options.realtime) {
    const { resource: realtimeResource, ...callbacks } = options.realtime;
    useRealtimeCollection<Item>(realtimeResource, {
      ...callbacks,
      // Only the open scope's list takes live changes; another scope's
      // leftover list counts as not loaded and is just marked stale.
      data: computed({
        get: () =>
          internal.loadedKey.value === internal.currentKey()
            ? internal.data.value
            : undefined,
        set: (value) => {
          internal.data.value = value;
        },
      }),
      invalidate: resource.invalidate,
      reload: resource.reload,
      ...(options.key ? { key: options.key } : {}),
    });
  }

  return resource;
}

/** The current key, for one-off requests in a scope that must be open. */
export function requireKey(key: () => string | undefined): string {
  const value = key();
  if (value === undefined) {
    throw new Error('No scope open for this request');
  }
  return value;
}

export { useRouteKey } from '@/composables/routeKey';
