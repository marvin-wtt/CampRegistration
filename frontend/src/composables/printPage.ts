import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
} from 'vue';
import { useRoute } from 'vue-router';
import { Platform } from 'quasar';

export interface UsePrintPageOptions<T> {
  /**
   * Message channel prefix shared with the opener/parent, e.g. `PRINT_TABLES`.
   * The composable emits `${prefix}:LOADED|READY|PRINTING|AFTERPRINT|ERROR`.
   */
  messagePrefix: string;
  /** Fallback sessionStorage key when the route has no `key` query param. */
  defaultStorageKey: string;
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
 * Shared plumbing for the standalone print routes (tables, calendar): loads the
 * payload from sessionStorage, drives the print dialog, and reports lifecycle
 * back to the opener (iframe parent on desktop, opener window on mobile).
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
  const { messagePrefix, defaultStorageKey, prepare, beforePrint } = options;
  const route = useRoute();

  const payload = ref<T | null>(null) as Ref<T | null>;
  const error = ref<string | null>(null);

  const storageKey = computed<string>(() => {
    const key = (route.query.key as string | undefined)?.trim();
    return key && key.length > 0 ? key : defaultStorageKey;
  });

  function isStandaloneWindow(): boolean {
    // In an iframe, window.parent differs from window. As a popup it does not,
    // but window.opener points back to the page that started the export.
    return window.parent === window;
  }

  function postToParent(msg: unknown): void {
    // Target the iframe parent, or the opener when running as a standalone window.
    const target = isStandaloneWindow() ? window.opener : window.parent;
    try {
      target?.postMessage(msg, window.location.origin);
    } catch {
      // ignore
    }
  }

  function cleanupSessionStorage(): void {
    try {
      sessionStorage.removeItem(storageKey.value);
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
    cleanupSessionStorage();
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

  function loadPayload(): T | null {
    const raw = sessionStorage.getItem(storageKey.value);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  onMounted(async () => {
    window.addEventListener('afterprint', onAfterPrint);
    window.addEventListener('focus', onFocus);
    if (beforePrint) {
      window.addEventListener('beforeprint', beforePrint);
    }

    const p = loadPayload();
    if (!p) {
      error.value =
        'No print payload found. Please start the export from the management page.';
      postToParent({ type: `${messagePrefix}:ERROR`, error: error.value });
      return;
    }

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
  // Two frames is usually enough for Quasar/QTable layout + icon/font settling.
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}
