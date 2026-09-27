import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { usePrintPage, waitForImages } from '@/composables/printPage';

const PREFIX = 'PRINT_TEST';

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
  // What the stubbed opener answers to a payload request; undefined = silence.
  let answer: unknown;
  let opener: { postMessage: (msg: { type: string }) => void };

  function deliverPayload(payload: unknown, source: unknown = opener): void {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: `${PREFIX}:PAYLOAD`, payload: JSON.stringify(payload) },
        origin: window.location.origin,
        source: source as Window,
      }),
    );
  }

  beforeEach(() => {
    messages = [];
    answer = { value: 'ok' };
    // Runs as a standalone window in happy-dom, so messages go to the opener.
    opener = {
      postMessage: (msg) => {
        messages.push(msg);
        if (msg.type === `${PREFIX}:REQUEST` && answer !== undefined) {
          deliverPayload(answer);
        }
      },
    };
    vi.stubGlobal('opener', opener);
    // happy-dom implements neither print() nor close().
    vi.stubGlobal('print', vi.fn());
    vi.stubGlobal('close', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function types(): string[] {
    return messages.map((m) => (m as { type: string }).type);
  }

  it('reports an error and never prints when the opener does not answer', async () => {
    vi.useFakeTimers();
    answer = undefined;
    const prepare = vi.fn();
    const wrapper = mountPrintPage(prepare);
    await flushPromises();

    expect(types()).toEqual([`${PREFIX}:REQUEST`]);

    await vi.advanceTimersByTimeAsync(5000);

    expect(types()).toEqual([`${PREFIX}:REQUEST`, `${PREFIX}:ERROR`]);
    expect(wrapper.text()).toContain('No print payload received');
    expect(prepare).not.toHaveBeenCalled();
    expect(window.print).not.toHaveBeenCalled();
  });

  it('reports an error right away without an opener', async () => {
    vi.stubGlobal('opener', null);
    const wrapper = mountPrintPage(vi.fn());
    await flushPromises();

    expect(wrapper.text()).toContain('No print payload received');
    expect(window.print).not.toHaveBeenCalled();
  });

  it('ignores payloads from windows other than the opener', async () => {
    answer = undefined;
    const wrapper = mountPrintPage(() => {});
    await flushPromises();

    deliverPayload({ value: 'forged' }, {});
    await flushPromises();
    expect(wrapper.text()).toBe('');

    deliverPayload({ value: 'real' });
    await flushPromises();
    expect(wrapper.text()).toBe('real');
    expect(window.print).toHaveBeenCalledOnce();
  });

  it('waits for prepare to settle before printing', async () => {
    let finishPrepare!: () => void;
    const prepare = vi.fn(
      () => new Promise<void>((resolve) => (finishPrepare = resolve)),
    );

    mountPrintPage(prepare);
    await flushPromises();

    expect(prepare).toHaveBeenCalledWith({ value: 'ok' });
    expect(types()).toEqual([`${PREFIX}:REQUEST`, `${PREFIX}:LOADED`]);
    expect(window.print).not.toHaveBeenCalled();

    finishPrepare();
    await flushPromises();

    expect(types()).toEqual([
      `${PREFIX}:REQUEST`,
      `${PREFIX}:LOADED`,
      `${PREFIX}:READY`,
      `${PREFIX}:PRINTING`,
    ]);
    expect(window.print).toHaveBeenCalledOnce();
  });

  it('reports and closes the window after printing', async () => {
    mountPrintPage(() => {});
    await flushPromises();

    window.dispatchEvent(new Event('afterprint'));

    expect(types()).toContain(`${PREFIX}:AFTERPRINT`);
    expect(window.close).toHaveBeenCalledOnce();
  });
});
