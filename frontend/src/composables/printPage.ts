import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Platform } from 'quasar';

// The opener answers right away; this only guards against it having gone away.
const PAYLOAD_TIMEOUT_MS = 5000;

export interface UsePrintPageOptions<T> {
  /**
   * Message channel prefix shared with the opener/parent, e.g. `PRINT_TABLES`.
   * The composable emits `${prefix}:REQUEST|LOADED|READY|PRINTING|AFTERPRINT|ERROR`
   * and receives the payload as `${prefix}:PAYLOAD`.
   */
  messagePrefix: string;
  /**
   * Settle the layout (fonts, table sizing, …) after the payload is rendered
   * and before the print dialog opens. Runs once per export.
   */
  prepare: (payload: T) => void | Promise<void>;
  /** Optional `beforeprint` handler (re-measured right before each print). */
  beforePrint?: () => void;
}

export interface UsePrintPageResult<T> {
  payload: Ref<T | null>;
  error: Ref<string | null>;
}

/**
 * Shared plumbing for the standalone print routes: requests the payload from
 * the opener (iframe parent on desktop, opener window on mobile) over
 * postMessage, drives the print dialog, and reports lifecycle back to it. The
 * payload is never persisted, so nothing outlives the print window.
 *
 * Closing the window is browser-specific: Chrome for Android fires `afterprint`
 * immediately when window.print() is called — before the user has saved or
 * cancelled — so closing then aborts the print job ("An error occurred while
 * printing the page."). There we close on `focus` (when the user returns to the
 * window) instead; everywhere else `afterprint` is the right moment.
 */
export function usePrintPage<T>(
  options: UsePrintPageOptions<T>,
): UsePrintPageResult<T> {
  const { messagePrefix, prepare, beforePrint } = options;
  const { locale } = useI18n({ useScope: 'global' });

  const payload = ref<T | null>(null) as Ref<T | null>;
  const error = ref<string | null>(null);

  function isStandaloneWindow(): boolean {
    // In an iframe, window.parent differs from window. As a popup it does not,
    // but window.opener points back to the page that started the export.
    return window.parent === window;
  }

  function messageTarget(): Window | null {
    return isStandaloneWindow()
      ? (window.opener as Window | null)
      : window.parent;
  }

  function postToParent(msg: unknown): void {
    try {
      messageTarget()?.postMessage(msg, window.location.origin);
    } catch {
      // ignore
    }
  }

  function isChromeMobile(): boolean {
    return (Platform.is.mobile ?? false) && (Platform.is.chrome ?? false);
  }

  let printTriggered = false;

  function closeStandaloneWindow(): void {
    if (isStandaloneWindow() && window.opener) {
      window.close();
    }
  }

  function triggerPrint(): void {
    postToParent({ type: `${messagePrefix}:PRINTING` });
    printTriggered = true;
    window.print();
  }

  function onAfterPrint(): void {
    postToParent({ type: `${messagePrefix}:AFTERPRINT` });

    // On Chrome mobile `afterprint` fires too early; onFocus handles the close.
    if (!isChromeMobile()) {
      closeStandaloneWindow();
    }
  }

  function onFocus(): void {
    // Chrome mobile only: the print UI took focus; when it returns to this
    // window the print job is finished, so the window can be closed.
    if (printTriggered) {
      closeStandaloneWindow();
    }
  }

  function requestPayload(): Promise<T | null> {
    const target = messageTarget();
    if (!target) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const finish = (p: T | null) => {
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        resolve(p);
      };

      const onMessage = (ev: MessageEvent) => {
        if (ev.source !== target || ev.origin !== window.location.origin) {
          return;
        }
        const data = ev.data as { type?: unknown; payload?: unknown } | null;
        if (
          data?.type !== `${messagePrefix}:PAYLOAD` ||
          typeof data.payload !== 'string'
        ) {
          return;
        }
        try {
          finish(JSON.parse(data.payload) as T);
        } catch {
          finish(null);
        }
      };

      const timer = setTimeout(() => finish(null), PAYLOAD_TIMEOUT_MS);
      window.addEventListener('message', onMessage);
      postToParent({ type: `${messagePrefix}:REQUEST` });
    });
  }

  // Print pages load in a fresh iframe/window, whose i18n instance boots to
  // the browser locale (see boot/i18n.ts) rather than the user's selected
  // in-app locale. Payloads carry that locale explicitly so it can be applied
  // here before anything renders.
  function applyPayloadLocale(p: T): void {
    const payloadLocale = (p as { locale?: unknown }).locale;
    if (typeof payloadLocale === 'string' && payloadLocale.length > 0) {
      locale.value = payloadLocale;
    }
  }

  onMounted(async () => {
    window.addEventListener('afterprint', onAfterPrint);
    window.addEventListener('focus', onFocus);
    if (beforePrint) {
      window.addEventListener('beforeprint', beforePrint);
    }

    const p = await requestPayload();
    if (!p) {
      error.value =
        'No print payload received. Please start the export from the management page.';
      postToParent({ type: `${messagePrefix}:ERROR`, error: error.value });
      return;
    }

    applyPayloadLocale(p);
    payload.value = p;
    postToParent({ type: `${messagePrefix}:LOADED` });

    await prepare(p);

    postToParent({ type: `${messagePrefix}:READY` });
    triggerPrint();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('afterprint', onAfterPrint);
    window.removeEventListener('focus', onFocus);
    if (beforePrint) {
      window.removeEventListener('beforeprint', beforePrint);
    }
  });

  return { payload, error };
}

/** Waits for fonts and a couple of frames so layout/measurements are stable. */
export async function waitForStableLayout(): Promise<void> {
  await nextTick();
  const anyDoc = document as unknown as { fonts?: { ready?: Promise<void> } };
  if (anyDoc.fonts?.ready) {
    try {
      await anyDoc.fonts.ready;
    } catch {
      // ignore — some environments don't support document.fonts
    }
  }
  await waitForImages();
  // Two frames is usually enough for Quasar/QTable layout + icon/font settling.
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}

/**
 * Waits until every `<img>` below `root` has loaded (or failed), so images such
 * as country flags are not missing from the printout. Bounded by `timeoutMs`
 * so one stalled request cannot block printing forever.
 */
export async function waitForImages(
  root: ParentNode = document,
  timeoutMs = 5000,
): Promise<void> {
  const pending = Array.from(root.querySelectorAll('img'))
    .filter((img) => !img.complete)
    .map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    );

  if (pending.length === 0) {
    return;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });

  await Promise.race([Promise.all(pending), timeout]);
  clearTimeout(timer);
}
