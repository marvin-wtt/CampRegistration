import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import type { EffectScope, Ref } from 'vue';
import type {
  RealtimeEvent,
  RealtimeResource,
} from '@camp-registration/common/realtime';
import { useRealtimeCollection } from 'src/composables/realtimeCollection';

interface Item {
  id: string;
  value: string;
}

const registry = vi.hoisted(() => {
  const handlers = new Map<string, (event: unknown) => void>();
  const reconnectHandlers = new Map<string, () => void>();
  return { handlers, reconnectHandlers };
});

vi.mock('stores/realtime-store', () => ({
  useRealtimeStore: () => ({
    on: (resource: string, handler: (event: unknown) => void) => {
      registry.handlers.set(resource, handler);
      return () => registry.handlers.delete(resource);
    },
    onReconnect: (resource: string, handler: () => void) => {
      registry.reconnectHandlers.set(resource, handler);
      return () => registry.reconnectHandlers.delete(resource);
    },
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { campId: 'camp-1' } }),
}));

function emit(
  partial: Partial<RealtimeEvent> & { resource: RealtimeResource },
) {
  registry.handlers.get(partial.resource)?.({
    id: 'item-1',
    operation: 'updated',
    at: new Date().toISOString(),
    ...partial,
  });
}

function reconnect(resource: RealtimeResource) {
  registry.reconnectHandlers.get(resource)?.();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const notFound = () => ({
  isAxiosError: true,
  response: { status: 404 },
});

describe('useRealtimeCollection', () => {
  let scope: EffectScope;
  let data: Ref<Item[] | undefined>;
  let invalidate: ReturnType<typeof vi.fn>;
  let reload: ReturnType<typeof vi.fn>;

  function mount(options?: {
    fetchOne?: (campId: string, id: string) => Promise<Item>;
    debounceMs?: number;
  }) {
    scope = effectScope();
    scope.run(() => {
      useRealtimeCollection<Item>('task', {
        data,
        invalidate,
        reload,
        ...options,
      });
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    registry.handlers.clear();
    registry.reconnectHandlers.clear();
    data = ref<Item[]>();
    invalidate = vi.fn();
    reload = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    scope?.stop();
    vi.useRealTimers();
  });

  it('only invalidates when the list is not loaded', async () => {
    const fetchOne = vi.fn();
    mount({ fetchOne });

    emit({ resource: 'task', operation: 'created' });
    await vi.runAllTimersAsync();

    expect(invalidate).toHaveBeenCalledOnce();
    expect(fetchOne).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('removes deleted entities without fetching', async () => {
    const fetchOne = vi.fn();
    data.value = [
      { id: 'item-1', value: 'a' },
      { id: 'item-2', value: 'b' },
    ];
    mount({ fetchOne });

    emit({ resource: 'task', operation: 'deleted', id: 'item-1' });
    await vi.runAllTimersAsync();

    expect(data.value).toEqual([{ id: 'item-2', value: 'b' }]);
    expect(fetchOne).not.toHaveBeenCalled();
  });

  it('refetches and upserts on create and update', async () => {
    const fetchOne = vi
      .fn()
      .mockResolvedValueOnce({ id: 'item-2', value: 'new' })
      .mockResolvedValueOnce({ id: 'item-1', value: 'changed' });
    data.value = [{ id: 'item-1', value: 'a' }];
    mount({ fetchOne });

    emit({ resource: 'task', operation: 'created', id: 'item-2' });
    await vi.runAllTimersAsync();
    emit({ resource: 'task', operation: 'updated', id: 'item-1' });
    await vi.runAllTimersAsync();

    expect(fetchOne).toHaveBeenCalledWith('camp-1', 'item-2');
    expect(fetchOne).toHaveBeenCalledWith('camp-1', 'item-1');
    expect(data.value).toEqual([
      { id: 'item-1', value: 'changed' },
      { id: 'item-2', value: 'new' },
    ]);
  });

  it('coalesces events for an id arriving while a fetch is in flight', async () => {
    const first = deferred<Item>();
    const second = deferred<Item>();
    const fetchOne = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    data.value = [{ id: 'item-1', value: 'a' }];
    mount({ fetchOne });

    // Three rapid events; the first starts a fetch, the rest coalesce into
    // exactly one trailing refetch.
    emit({ resource: 'task', operation: 'updated', id: 'item-1' });
    emit({ resource: 'task', operation: 'updated', id: 'item-1' });
    emit({ resource: 'task', operation: 'updated', id: 'item-1' });

    first.resolve({ id: 'item-1', value: 'stale' });
    await vi.runAllTimersAsync();
    second.resolve({ id: 'item-1', value: 'fresh' });
    await vi.runAllTimersAsync();

    expect(fetchOne).toHaveBeenCalledTimes(2);
    expect(data.value).toEqual([{ id: 'item-1', value: 'fresh' }]);
  });

  it('drops the result of a fetch when the entity was deleted meanwhile', async () => {
    const pending = deferred<Item>();
    const fetchOne = vi.fn().mockReturnValueOnce(pending.promise);
    data.value = [{ id: 'item-1', value: 'a' }];
    mount({ fetchOne });

    emit({ resource: 'task', operation: 'updated', id: 'item-1' });
    emit({ resource: 'task', operation: 'deleted', id: 'item-1' });

    pending.resolve({ id: 'item-1', value: 'zombie' });
    await vi.runAllTimersAsync();

    expect(data.value).toEqual([]);
  });

  it('removes the entity when the refetch responds with 404', async () => {
    const fetchOne = vi.fn().mockRejectedValueOnce(notFound());
    data.value = [{ id: 'item-1', value: 'a' }];
    mount({ fetchOne });

    emit({ resource: 'task', operation: 'updated', id: 'item-1' });
    await vi.runAllTimersAsync();

    expect(data.value).toEqual([]);
  });

  it('debounces a burst of list-mode events into a single reload', async () => {
    data.value = [];
    mount(); // no fetchOne → list mode

    for (let i = 0; i < 5; i++) {
      emit({ resource: 'task', operation: 'created', id: `item-${i}` });
      await vi.advanceTimersByTimeAsync(40);
    }
    await vi.runAllTimersAsync();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads once for a collection invalidation', async () => {
    const fetchOne = vi.fn();
    data.value = [];
    mount({ fetchOne });

    emit({ resource: 'task', operation: 'invalidated', id: null });
    await vi.runAllTimersAsync();

    expect(reload).toHaveBeenCalledOnce();
    expect(fetchOne).not.toHaveBeenCalled();
  });

  it('discards an in-flight item fetch superseded by a reload', async () => {
    const pending = deferred<Item>();
    const fetchOne = vi.fn().mockReturnValueOnce(pending.promise);
    data.value = [{ id: 'item-1', value: 'a' }];
    mount({ fetchOne });

    emit({ resource: 'task', operation: 'updated', id: 'item-1' });
    emit({ resource: 'task', operation: 'invalidated', id: null });
    await vi.runAllTimersAsync();

    // The reload (fresher) already ran; the older per-item response must not
    // clobber it.
    pending.resolve({ id: 'item-1', value: 'stale' });
    await vi.runAllTimersAsync();

    expect(reload).toHaveBeenCalledOnce();
    expect(data.value).toEqual([{ id: 'item-1', value: 'a' }]);
  });

  it('reloads on reconnect only when the list is loaded', async () => {
    mount();

    reconnect('task');
    await vi.runAllTimersAsync();
    expect(reload).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledOnce();

    data.value = [];
    reconnect('task');
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('stops reacting after the owning scope is disposed', async () => {
    const fetchOne = vi.fn();
    data.value = [];
    mount({ fetchOne });

    scope.stop();
    emit({ resource: 'task', operation: 'created', id: 'item-1' });
    await vi.runAllTimersAsync();

    expect(fetchOne).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});
