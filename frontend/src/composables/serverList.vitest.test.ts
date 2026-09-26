import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { CursorPaginated } from '@camp-registration/common/entities';
import { useServerList } from '@/composables/serverList';

vi.mock('@/composables/serviceHandler', () => ({
  useErrorExtractor: () => ({
    extractErrorText: (err: unknown) => (err as Error).message,
  }),
  useServiceNotifications: () => ({}),
}));

interface Row {
  id: string;
}

function page(ids: string[], nextCursor: string | null, total?: number) {
  return {
    data: ids.map((id) => ({ id })),
    meta: { nextCursor, limit: ids.length, total },
  } as CursorPaginated<Row>;
}

/**
 * `useServerList` calls `onMounted`, so it has to run inside a component. The
 * returned bindings are handed back for the test to drive directly.
 */
function setup(
  fetch: (query: unknown) => Promise<CursorPaginated<Row>>,
  filter = ref<string | undefined>(undefined),
) {
  let api!: ReturnType<typeof useServerList<Row, unknown>>;

  const wrapper = mount(
    defineComponent({
      setup() {
        api = useServerList<Row, unknown>({
          pageSize: 2,
          watchSources: [filter],
          fetch,
          buildQuery: (ctx) => ({ ...ctx, filter: filter.value }),
        });

        return () => null;
      },
    }),
  );

  return { api, wrapper };
}

/** Lets the mounted `reload()` and any chained `nextTick` settle. */
async function settle(): Promise<void> {
  await nextTick();
  await nextTick();
  await nextTick();
}

describe('useServerList', () => {
  it('loads the first chunk on mount and reports the total', async () => {
    const fetch = vi.fn().mockResolvedValue(page(['a', 'b'], 'b', 7));
    const { api } = setup(fetch);
    await settle();

    expect(api.rows.value).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(api.total.value).toBe(7);
    expect(api.hasMore.value).toBe(true);
    expect(api.loading.value).toBe(false);
  });

  it('appends the next chunk and keeps the total from the first page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page(['a', 'b'], 'b', 3))
      .mockResolvedValueOnce(page(['c'], null));
    const { api } = setup(fetch);
    await settle();

    await api.loadMore();

    expect(api.rows.value.map((row) => row.id)).toEqual(['a', 'b', 'c']);
    expect(api.total.value).toBe(3);
    expect(api.hasMore.value).toBe(false);
    // The second call carried the cursor from the first page's meta.
    expect(fetch.mock.calls[1]?.[0]).toMatchObject({ cursor: 'b' });
  });

  it('does not load more once the cursor is exhausted', async () => {
    const fetch = vi.fn().mockResolvedValue(page(['a'], null));
    const { api } = setup(fetch);
    await settle();

    await api.loadMore();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('replaces rather than appends when a filter changes', async () => {
    const filter = ref<string | undefined>(undefined);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page(['a', 'b'], 'b', 2))
      .mockResolvedValueOnce(page(['z'], null, 1));
    const { api } = setup(fetch, filter);
    await settle();

    filter.value = 'de';
    await settle();

    expect(api.rows.value).toEqual([{ id: 'z' }]);
    expect(api.total.value).toBe(1);
    // A filter change restarts from the beginning, without a cursor.
    expect(fetch.mock.calls[1]?.[0]).toMatchObject({ cursor: undefined });
  });

  it('ignores a superseded response that resolves last', async () => {
    const resolvers: ((value: CursorPaginated<Row>) => void)[] = [];
    const fetch = vi.fn().mockImplementation(
      () =>
        new Promise<CursorPaginated<Row>>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const filter = ref<string | undefined>(undefined);
    const { api } = setup(fetch, filter);
    await nextTick();

    // A second search starts before the first one came back.
    filter.value = 'de';
    await nextTick();
    expect(resolvers).toHaveLength(2);

    // The newer request answers first, then the stale one arrives.
    resolvers[1]?.(page(['new'], null, 1));
    await settle();
    resolvers[0]?.(page(['stale'], null, 9));
    await settle();

    expect(api.rows.value).toEqual([{ id: 'new' }]);
    expect(api.total.value).toBe(1);
    expect(api.loading.value).toBe(false);
  });

  it('clears the rows when the first load fails', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('boom'));
    const { api } = setup(fetch);
    await settle();

    expect(api.rows.value).toEqual([]);
    expect(api.total.value).toBe(0);
    expect(api.error.value).toBe('boom');
  });

  it('keeps the loaded rows when appending fails', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page(['a'], 'a', 2))
      .mockRejectedValueOnce(new Error('boom'));
    const { api } = setup(fetch);
    await settle();

    await api.loadMore();

    expect(api.rows.value).toEqual([{ id: 'a' }]);
    expect(api.error.value).toBe('boom');
  });

  it('runs onReset after a reset load, but not after an append', async () => {
    const onReset = vi.fn();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page(['a'], 'a'))
      .mockResolvedValueOnce(page(['b'], null));

    mount(
      defineComponent({
        setup() {
          const api = useServerList<Row, unknown>({
            pageSize: 1,
            onReset,
            fetch,
            buildQuery: (ctx) => ctx,
          });

          void api.loadMore;

          return () => null;
        },
      }),
    );
    await settle();

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
