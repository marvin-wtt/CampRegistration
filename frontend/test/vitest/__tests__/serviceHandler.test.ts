import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useServiceHandler } from '@/composables/serviceHandler';
import type * as QuasarModule from 'quasar';

// `useServiceHandler` reaches for the active route and Quasar instance; neither
// is relevant to the fetch primitives under test, so stub them out.
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
}));

vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal<typeof QuasarModule>();
  return {
    ...actual,
    useQuasar: () => ({ notify: vi.fn(() => vi.fn()) }),
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useServiceHandler backgroundFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps existing data and does not flip isLoading while in flight', async () => {
    const handler = useServiceHandler<string[]>();
    handler.data.value = ['stale'];

    const d = deferred<string[]>();
    const run = handler.backgroundFetch(() => d.promise);

    // Mid-flight: previous data stays on screen, no full-page spinner, only the
    // background request indicator is active.
    expect(handler.data.value).toEqual(['stale']);
    expect(handler.isLoading.value).toBe(false);
    expect(handler.requestPending.value).toBe(true);

    d.resolve(['fresh']);
    await run;

    expect(handler.requestPending.value).toBe(false);
  });

  it('updates data and clears staleness on success', async () => {
    const handler = useServiceHandler<string[]>();
    handler.data.value = ['stale'];
    handler.invalidate();
    handler.error.value = 'old error';

    await handler.backgroundFetch(() => Promise.resolve(['fresh']));

    expect(handler.data.value).toEqual(['fresh']);
    expect(handler.error.value).toBeNull();
    expect(handler.isLoading.value).toBe(false);
  });

  it('preserves stale data and does not surface an error on failure', async () => {
    const handler = useServiceHandler<string[]>();
    handler.data.value = ['stale'];

    await expect(
      handler.backgroundFetch(() =>
        Promise.reject<string[]>(new Error('boom')),
      ),
    ).resolves.toBeUndefined();

    // Stale-while-revalidate: keep what we have, don't throw the page into the
    // error slot, and mark stale so a later lazyFetch recovers.
    expect(handler.data.value).toEqual(['stale']);
    expect(handler.error.value).toBeNull();
    expect(handler.requestPending.value).toBe(false);

    // A subsequent lazyFetch runs because the store was marked stale.
    const fetcher = vi.fn(() => Promise.resolve(['recovered']));
    await handler.lazyFetch(fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(handler.data.value).toEqual(['recovered']);
  });

  it('contrast: forceFetch blanks data and flips isLoading mid-flight', async () => {
    const handler = useServiceHandler<string[]>();
    handler.data.value = ['stale'];

    const d = deferred<string[]>();
    const run = handler.forceFetch(() => d.promise);

    // The blanking path collapses the view — this is the behaviour we
    // deliberately avoid on realtime reconnect.
    expect(handler.data.value).toBeUndefined();
    expect(handler.isLoading.value).toBe(true);

    d.resolve(['fresh']);
    await run;

    expect(handler.data.value).toEqual(['fresh']);
    expect(handler.isLoading.value).toBe(false);
  });
});
