import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { usePrintPage, waitForImages } from '@/composables/printPage';

const route = { query: {} as Record<string, string> };

vi.mock('vue-router', () => ({
  useRoute: () => route,
}));

const PREFIX = 'PRINT_TEST';
const STORAGE_KEY = 'print:test:payload';

function pendingImage(): HTMLImageElement {
  const img = document.createElement('img');
  // happy-dom never fetches, so every image reports complete by default.
  Object.defineProperty(img, 'complete', { value: false });
  document.body.appendChild(img);

  return img;
}

function mountPrintPage(prepare: (payload: unknown) => Promise<void> | void) {
  return mount(
    defineComponent({
      setup() {
        const { payload, error } = usePrintPage<{ value: string }>({
          messagePrefix: PREFIX,
          defaultStorageKey: STORAGE_KEY,
          prepare,
        });

        return () => h('div', error.value ?? payload.value?.value ?? '');
      },
    }),
  );
}

describe('waitForImages', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves immediately when all images are complete', async () => {
    document.body.appendChild(document.createElement('img'));

    await expect(waitForImages()).resolves.toBeUndefined();
  });

  it('waits until every pending image has loaded or failed', async () => {
    const loading = pendingImage();
    const failing = pendingImage();

    let done = false;
    const promise = waitForImages().then(() => (done = true));

    loading.dispatchEvent(new Event('load'));
    await flushPromises();
    expect(done).toBe(false);

    failing.dispatchEvent(new Event('error'));
    await promise;
    expect(done).toBe(true);
  });

  it('stops waiting after the timeout', async () => {
    vi.useFakeTimers();
    try {
      pendingImage();

      let done = false;
      const promise = waitForImages(document, 1000).then(() => (done = true));

      await vi.advanceTimersByTimeAsync(999);
      expect(done).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      await promise;
      expect(done).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('usePrintPage', () => {
  let messages: unknown[];

  beforeEach(() => {
    route.query = {};
    sessionStorage.clear();
    messages = [];
    // Runs as a standalone window in happy-dom, so messages go to the opener.
    vi.stubGlobal('opener', {
      postMessage: (msg: unknown) => messages.push(msg),
    });
    // happy-dom implements neither print() nor close().
    vi.stubGlobal('print', vi.fn());
    vi.stubGlobal('close', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function types(): string[] {
    return messages.map((m) => (m as { type: string }).type);
  }

  it('reports an error and never prints without a payload', async () => {
    const prepare = vi.fn();
    mountPrintPage(prepare);
    await flushPromises();

    expect(types()).toEqual([`${PREFIX}:ERROR`]);
    expect(prepare).not.toHaveBeenCalled();
    expect(window.print).not.toHaveBeenCalled();
  });

  it('reads the payload from the key given in the route', async () => {
    route.query = { key: 'custom-key' };
    sessionStorage.setItem('custom-key', JSON.stringify({ value: 'custom' }));

    const wrapper = mountPrintPage(() => {});
    await flushPromises();

    expect(wrapper.text()).toBe('custom');
    expect(window.print).toHaveBeenCalledOnce();
  });

  it('waits for prepare to settle before printing', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ value: 'ok' }));

    let finishPrepare!: () => void;
    const prepare = vi.fn(
      () => new Promise<void>((resolve) => (finishPrepare = resolve)),
    );

    mountPrintPage(prepare);
    await flushPromises();

    expect(prepare).toHaveBeenCalledWith({ value: 'ok' });
    expect(types()).toEqual([`${PREFIX}:LOADED`]);
    expect(window.print).not.toHaveBeenCalled();

    finishPrepare();
    await flushPromises();

    expect(types()).toEqual([
      `${PREFIX}:LOADED`,
      `${PREFIX}:READY`,
      `${PREFIX}:PRINTING`,
    ]);
    expect(window.print).toHaveBeenCalledOnce();
  });

  it('cleans up and closes the window after printing', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ value: 'ok' }));

    mountPrintPage(() => {});
    await flushPromises();

    window.dispatchEvent(new Event('afterprint'));

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(types()).toContain(`${PREFIX}:AFTERPRINT`);
    expect(window.close).toHaveBeenCalledOnce();
  });
});
