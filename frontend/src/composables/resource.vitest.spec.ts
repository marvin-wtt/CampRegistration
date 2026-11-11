import { beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, reactive } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { AxiosError, AxiosHeaders } from 'axios';
import { EventBus } from 'quasar';
import type * as QuasarModule from 'quasar';
import type { RealtimeEvent } from '@camp-registration/common/realtime';
import { useCollection, useResource } from '@/composables/resource';
import { isReportedError } from '@/utils/reportedError';
import { replaceById } from '@/utils/collection';

const mocks = vi.hoisted(() => {
  const params: Record<string, string | undefined> = {};
  return {
    notify: vi.fn(),
    route: { params },
    authBus: undefined as unknown as EventBus,
    realtime: undefined as ((event: RealtimeEvent) => void) | undefined,
  };
});

vi.mock('quasar', async (importOriginal) => ({
  ...(await importOriginal<typeof QuasarModule>()),
  useQuasar: () => ({ notify: mocks.notify }),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}));
vi.mock('@/composables/bus', () => ({
  useAuthBus: () => mocks.authBus,
}));
vi.mock('@/stores/realtime-store', () => ({
  useRealtimeStore: () => ({
    on: (_resource: string, handler: (event: RealtimeEvent) => void) => {
      mocks.realtime = handler;
      return () => undefined;
    },
    onReconnect: () => () => undefined,
  }),
}));

interface Row {
  id: string;
  name: string;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const offline = () => Promise.reject(new Error('offline'));
const refused = () =>
  Promise.reject(
    new AxiosError('Bad request', 'ERR', undefined, undefined, {
      status: 422,
      statusText: '',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data: { message: 'invalid' },
    }),
  );
const row = (id: string, name = id): Row => ({ id, name });

function setup(fetch: (key: string) => Promise<Row[]>) {
  return useResource<Row[]>({
    name: 'task',
    key: () => mocks.route.params.eventId,
    fetch,
  });
}

beforeEach(() => {
  mocks.notify.mockReset().mockReturnValue(vi.fn());
  mocks.route = reactive({ params: { eventId: 'A' } });
  mocks.authBus = new EventBus();
});

describe('load', () => {
  it('loads once and skips while fresh', async () => {
    const fetch = vi.fn().mockResolvedValue([row('1')]);
    const resource = setup(fetch);

    await resource.load();
    await resource.load();

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith('A');
    expect(resource.data.value).toEqual([row('1')]);
    expect(resource.isLoading.value).toBe(false);
  });

  it('loads again for another scope, without showing the old data', async () => {
    const next = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('a')])
      .mockReturnValueOnce(next.promise);
    const resource = setup(fetch);
    await resource.load();

    mocks.route.params.eventId = 'B';
    const loading = resource.load();
    expect(resource.data.value).toBeUndefined();
    expect(resource.isLoading.value).toBe(true);

    next.resolve([row('b')]);
    await loading;
    expect(fetch).toHaveBeenLastCalledWith('B');
    expect(resource.data.value).toEqual([row('b')]);
  });

  it('drops a slow response for a scope that was left', async () => {
    const slowA = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockReturnValueOnce(slowA.promise)
      .mockResolvedValueOnce([row('b')]);
    const resource = setup(fetch);

    const loadingA = resource.load();
    mocks.route.params.eventId = 'B';
    await resource.load();
    slowA.resolve([row('a')]);
    await loadingA;

    expect(resource.data.value).toEqual([row('b')]);
    expect(resource.isLoading.value).toBe(false);
  });

  it('loads again after the scope was left and opened again', async () => {
    const fetch = vi.fn().mockResolvedValue([]);
    const resource = setup(fetch);
    await resource.load();

    mocks.route.params.eventId = undefined;
    await nextTick();
    mocks.route.params.eventId = 'A';
    await resource.load();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('loads again after invalidate', async () => {
    const fetch = vi.fn().mockResolvedValue([]);
    const resource = setup(fetch);
    await resource.load();

    resource.invalidate();
    await resource.load();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shows a failed load and retries it next time', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([row('1')]);
    const resource = setup(fetch);

    await resource.load();
    expect(resource.error.value).toBe('offline');

    await resource.load();
    expect(resource.error.value).toBeNull();
    expect(resource.data.value).toEqual([row('1')]);
  });

  it('reports a missing scope instead of fetching', async () => {
    const fetch = vi.fn();
    const resource = setup(fetch);
    mocks.route.params.eventId = undefined;

    await resource.load();

    expect(fetch).not.toHaveBeenCalled();
    expect(resource.error.value).toBe('service.invalidParams');
  });

  it('resets on logout', async () => {
    const resource = setup(() => Promise.resolve([row('1')]));
    await resource.load();

    mocks.authBus.emit('logout');

    expect(resource.data.value).toBeUndefined();
  });

  it('stops listening for logout once its scope is disposed', () => {
    const scope = effectScope();
    scope.run(() => setup(() => Promise.resolve([])));
    const off = vi.spyOn(mocks.authBus, 'off');

    scope.stop();

    expect(off).toHaveBeenCalledWith('logout', expect.any(Function));
  });
});

describe('concurrent load', () => {
  it('joins a load in flight for the same scope', async () => {
    const first = deferred<Row[]>();
    const fetch = vi.fn().mockReturnValueOnce(first.promise);
    const resource = setup(fetch);

    const a = resource.load();
    const b = resource.load();
    first.resolve([row('1')]);
    await Promise.all([a, b]);

    expect(fetch).toHaveBeenCalledOnce();
    expect(resource.data.value).toEqual([row('1')]);
  });

  it('resolves once a superseding reload has landed', async () => {
    const first = deferred<Row[]>();
    const second = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const resource = setup(fetch);

    const loading = resource.load();
    const reloading = resource.reload();
    first.resolve([row('stale')]);
    let settled = false;
    void loading.then(() => (settled = true));
    await flushPromises();
    expect(settled).toBe(false);

    second.resolve([row('fresh')]);
    await Promise.all([loading, reloading]);
    expect(resource.data.value).toEqual([row('fresh')]);
  });
});

describe('reload', () => {
  it('keeps the data shown until the response arrives', async () => {
    const next = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockReturnValueOnce(next.promise);
    const resource = setup(fetch);
    await resource.load();

    const reloading = resource.reload();
    expect(resource.data.value).toEqual([row('1')]);
    expect(resource.pending.value).toBe(true);

    next.resolve([row('2')]);
    await reloading;
    expect(resource.data.value).toEqual([row('2')]);
    expect(resource.pending.value).toBe(false);
  });

  it('reloads the scope its data belongs to, not the current route', async () => {
    const fetch = vi.fn().mockResolvedValue([]);
    const resource = setup(fetch);
    await resource.load();

    mocks.route.params.eventId = 'B';
    await resource.reload();

    expect(fetch).toHaveBeenLastCalledWith('A');
  });

  it('keeps the data and shows no error when it fails', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockRejectedValueOnce(new Error('offline'));
    const resource = setup(fetch);
    await resource.load();

    await expect(resource.reload()).resolves.toBeUndefined();

    expect(resource.data.value).toEqual([row('1')]);
    expect(resource.error.value).toBeNull();
  });

  it('ends the loading state when it supersedes a first load', async () => {
    const first = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([row('fresh')]);
    const resource = setup(fetch);

    const loading = resource.load();
    await resource.reload();
    first.resolve([row('stale')]);
    await loading;

    expect(resource.isLoading.value).toBe(false);
    expect(resource.data.value).toEqual([row('fresh')]);
  });

  it('reports the error when it supersedes a first load and fails', async () => {
    const first = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new Error('offline'));
    const resource = setup(fetch);

    const loading = resource.load();
    await resource.reload();
    first.resolve([]);
    await loading;

    expect(resource.isLoading.value).toBe(false);
    expect(resource.error.value).toBe('offline');
  });

  it('does nothing before anything was loaded', async () => {
    const fetch = vi.fn();
    const resource = setup(fetch);

    await resource.reload();

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('mutate', () => {
  it('applies the result and shows no toast', async () => {
    const resource = setup(() => Promise.resolve([row('1'), row('2')]));
    await resource.load();

    const result = await resource.mutate(
      'update',
      (key) => Promise.resolve(row('2', `renamed in ${key}`)),
      { apply: replaceById },
    );

    expect(result).toEqual(row('2', 'renamed in A'));
    expect(resource.data.value).toEqual([row('1'), row('2', 'renamed in A')]);
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it('reports, reloads and rejects with a reported error', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockResolvedValueOnce([row('1', 'server')]);
    const resource = setup(fetch);
    await resource.load();
    const error = new Error('offline');

    await expect(
      resource.mutate('update', () => Promise.reject(error)),
    ).rejects.toBe(error);
    await flushPromises();

    expect(isReportedError(error)).toBe(true);
    expect(mocks.notify).toHaveBeenCalledOnce();
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'stores.task.update.error',
        caption: 'offline',
      }),
    );
    expect(resource.data.value).toEqual([row('1', 'server')]);
  });

  it('does not reload after a write the server refused', async () => {
    const fetch = vi.fn().mockResolvedValue([row('1')]);
    const resource = setup(fetch);
    await resource.load();

    await expect(resource.mutate('update', refused)).rejects.toThrow();
    await flushPromises();

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('reloads after a refused multi-write, which may have applied some', async () => {
    const fetch = vi.fn().mockResolvedValue([row('1')]);
    const resource = setup(fetch);
    await resource.load();

    await expect(
      resource.mutate('update', refused, { multiWrite: true }),
    ).rejects.toThrow();
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('refetches when it lands during the first load', async () => {
    const first = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([row('1'), row('2')]);
    const resource = setup(fetch);

    const loading = resource.load();
    await resource.mutate('create', () => Promise.resolve(row('2')), {
      apply: (list, created) => [...list, created],
    });
    first.resolve([row('1')]);
    await loading;
    await flushPromises();

    expect(resource.data.value).toEqual([row('1'), row('2')]);
    expect(resource.isLoading.value).toBe(false);
  });

  it('skips the follow-up of a failed write', async () => {
    const resource = setup(() => Promise.resolve([]));
    const followUp = vi.fn();

    await resource
      .mutate('update', offline)
      .then(followUp)
      .catch(() => undefined);

    expect(followUp).not.toHaveBeenCalled();
  });

  it('targets the scope it started in', async () => {
    const request = deferred<Row>();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockResolvedValueOnce([row('b')]);
    const resource = setup(fetch);
    await resource.load();

    const writing = resource.mutate(
      'update',
      (key) => {
        expect(key).toBe('A');
        return request.promise;
      },
      { apply: (list, item) => [...list, item] },
    );
    mocks.route.params.eventId = 'B';
    await resource.load();
    request.resolve(row('late'));
    await writing;

    // A's result never lands in B's list.
    expect(resource.data.value).toEqual([row('b')]);
  });

  it('does not reload another scope after a failure', async () => {
    const request = deferred<Row>();
    const fetch = vi.fn().mockResolvedValue([]);
    const resource = setup(fetch);
    await resource.load();

    const writing = resource.mutate('update', () => request.promise);
    mocks.route.params.eventId = 'B';
    await resource.load();
    request.reject(new Error('offline'));
    await writing.catch(() => undefined);
    await flushPromises();

    expect(fetch.mock.calls).toEqual([['A'], ['B']]);
  });

  it('shows an optimistic change and undoes it on failure', async () => {
    const request = deferred<Row>();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockReturnValueOnce(new Promise(() => undefined));
    const resource = setup(fetch);
    await resource.load();

    const writing = resource.mutate('update', () => request.promise, {
      optimistic: (list) => replaceById(list, row('1', 'moved')),
    });
    expect(resource.data.value).toEqual([row('1', 'moved')]);

    request.reject(new Error('offline'));
    await writing.catch(() => undefined);
    expect(resource.data.value).toEqual([row('1')]);
  });

  it('keeps a change made after the optimistic one when undoing', async () => {
    const request = deferred<Row>();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockReturnValueOnce(new Promise(() => undefined));
    const resource = setup(fetch);
    await resource.load();

    const writing = resource.mutate('update', () => request.promise, {
      optimistic: (list) => replaceById(list, row('1', 'moved')),
    });
    resource.update((list) => [...list, row('2')]);
    request.reject(new Error('offline'));
    await writing.catch(() => undefined);

    expect(resource.data.value).toEqual([row('1', 'moved'), row('2')]);
  });

  it('reloads again when an older reload would undo the write', async () => {
    const olderReload = deferred<Row[]>();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockReturnValueOnce(olderReload.promise)
      .mockResolvedValueOnce([row('1', 'saved')]);
    const resource = setup(fetch);
    await resource.load();

    const reloading = resource.reload();
    await resource.mutate('update', () => Promise.resolve(row('1', 'saved')), {
      apply: replaceById,
    });
    olderReload.resolve([row('1')]);
    await reloading;
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(resource.data.value).toEqual([row('1', 'saved')]);
  });

  it('rolls back by the given undo when the data changed meanwhile', async () => {
    const fetch = vi.fn().mockResolvedValue([row('1')]);
    const resource = setup(fetch);
    await resource.load();
    const request = deferred<Row>();

    const writing = resource.mutate('create', () => request.promise, {
      optimistic: (list) => [...list, row('#tmp')],
      rollback: (list) => list.filter((entry) => entry.id !== '#tmp'),
    });
    resource.update((list) => [...list, row('2')]);
    request.reject(await refused().catch((err: unknown) => err));
    await writing.catch(() => undefined);
    await flushPromises();

    expect(resource.data.value?.map((entry) => entry.id)).toEqual(['1', '2']);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('reloads when a refused optimistic change cannot be undone', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce([row('1')])
      .mockResolvedValueOnce([row('1')]);
    const resource = setup(fetch);
    await resource.load();
    const request = deferred<Row>();

    const writing = resource.mutate('update', () => request.promise, {
      optimistic: () => [row('1', 'moved')],
    });
    resource.update((list) => [...list, row('2')]);
    request.reject(await refused().catch((err: unknown) => err));
    await writing.catch(() => undefined);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(resource.data.value).toEqual([row('1')]);
  });

  it('counts as pending while it runs', async () => {
    const request = deferred<void>();
    const resource = setup(() => Promise.resolve([]));

    const writing = resource.mutate('update', () => request.promise);
    expect(resource.pending.value).toBe(true);

    request.resolve();
    await writing;
    expect(resource.pending.value).toBe(false);
  });

  it('refuses to write without a scope', async () => {
    const resource = setup(() => Promise.resolve([]));
    mocks.route.params.eventId = undefined;
    const request = vi.fn();

    const writing = resource.mutate('update', request);

    await expect(writing).rejects.toThrow('service.invalidParams');
    await writing.catch((err: unknown) =>
      expect(isReportedError(err)).toBe(true),
    );
    expect(mocks.notify).toHaveBeenCalledOnce();
    expect(request).not.toHaveBeenCalled();
  });

  it('turns the progress toast into the error', async () => {
    const toast = vi.fn();
    mocks.notify.mockReturnValue(toast);
    const resource = setup(() => Promise.resolve([]));

    await resource
      .mutate('update', offline, { feedback: 'progress' })
      .catch(() => undefined);

    expect(mocks.notify).toHaveBeenCalledOnce();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', caption: 'offline' }),
    );
  });
});

describe('useCollection realtime', () => {
  function setupLive(fetchOne: (eventId: string, id: string) => Promise<Row>) {
    const fetch = vi
      .fn()
      .mockImplementation((key: string) => Promise.resolve([row(`${key}1`)]));
    const collection = useCollection<Row>({
      name: 'task',
      key: () => mocks.route.params.eventId,
      fetch,
      realtime: { resource: 'task', fetchOne },
    });
    return { collection, fetch };
  }

  it('applies a live change to the open scope', async () => {
    const { collection } = setupLive(() =>
      Promise.resolve(row('A1', 'remote')),
    );
    await collection.load();

    mocks.realtime!({
      resource: 'task',
      id: 'A1',
      operation: 'updated',
    } as RealtimeEvent);
    await flushPromises();

    expect(collection.data.value).toEqual([row('A1', 'remote')]);
  });

  it('keeps live changes of another scope out of a leftover list', async () => {
    const fetchOne = vi.fn().mockResolvedValue(row('B9'));
    const { collection, fetch } = setupLive(fetchOne);
    await collection.load();

    mocks.route.params.eventId = 'B';
    mocks.realtime!({
      resource: 'task',
      id: 'B9',
      operation: 'created',
    } as RealtimeEvent);
    await flushPromises();

    expect(fetchOne).not.toHaveBeenCalled();
    expect(collection.data.value).toEqual([row('A1')]);
    await collection.load();
    expect(fetch).toHaveBeenLastCalledWith('B');
  });
});
