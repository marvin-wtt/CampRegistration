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
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { RealtimeResource } from '@camp-registration/common/realtime';
import { useAuthBus } from '@/composables/bus';
import { useErrorExtractor } from '@/composables/errorText';
import { useAction } from '@/composables/action';
import type { ActionOptions, ReportProgress } from '@/composables/action';
import {
  useRealtimeCollection,
  type RealtimeCollectionOptions,
} from '@/composables/realtimeCollection';

/** Unscoped resources (e.g. the user's own organizations) use this key. */
const GLOBAL_KEY = 'global';

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
  /** Overrides the scope the write targets; defaults to the current key. */
  key?: string;
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
  let reloadsInFlight = 0;
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

  /** Loads the data for `key` unless it is already loaded and fresh. */
  async function load(key: string | undefined = currentKey()): Promise<void> {
    if (key === undefined) {
      error.value = t('service.invalidParams');
      return;
    }
    if (key === loadedKey.value && !stale) {
      return;
    }

    const ticket = ++token;
    loadedKey.value = key;
    data.value = undefined;
    error.value = null;
    isLoading.value = true;
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
      if (ticket === token) {
        isLoading.value = false;
      }
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
    reloadsInFlight++;
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
      reloadsInFlight--;
      pendingCount.value--;
      if (supersedesLoad && ticket === token) {
        isLoading.value = false;
      }
    }
  }

  /** Marks the data stale, so the next `load` fetches it again. */
  function invalidate() {
    stale = true;
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
   * data is reloaded — the server may have applied all, some or none of it —
   * and the call rejects with the error marked as reported, so follow-ups
   * are skipped without anything reporting it twice.
   */
  async function mutate<R>(
    operation: string,
    request: (key: string, report: ReportProgress) => Promise<R>,
    {
      apply,
      optimistic,
      key: explicitKey,
      ...action
    }: MutateOptions<T, R> = {},
  ): Promise<R> {
    const key = explicitKey ?? currentKey();
    if (key === undefined) {
      throw new Error(`${options.name ?? 'resource'}.${operation}: no scope`);
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
      if (apply && isLoadedFor(key)) {
        data.value = apply(data.value as T, result);
        // A reload started before this write would bring back the old state.
        if (reloadsInFlight > 0) {
          void reload();
        }
      }
      return result;
    } catch (err: unknown) {
      if (shown !== undefined && toRaw(data.value) === toRaw(shown)) {
        data.value = previous;
      }
      if (loadedKey.value === key) {
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
  'data' | 'invalidate' | 'reload'
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
  const { resource, internal } = createResource<Item[]>(options);

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

/** The scope key of a route param, e.g. `useRouteKey('eventId')`. */
export function useRouteKey(param: string): () => string | undefined {
  // Undefined outside a router (e.g. a component test): no scope is open.
  const route = useRoute() as ReturnType<typeof useRoute> | undefined;
  return () => {
    const value = route?.params[param];
    const key = Array.isArray(value) ? value[0] : value;
    return key && key.length > 0 ? key : undefined;
  };
}
