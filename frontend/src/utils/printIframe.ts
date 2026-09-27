import { Platform } from 'quasar';

export interface PrintIframeOptions<T> {
  messagePrefix: string;
  /** Handed to the print page over postMessage when it asks for it. */
  payload: T;
  widthPx?: number;
  heightPx?: number;
  onError?: (error: string) => void;
  onAfterPrint?: () => void;
}

export function openPrintIframe<T>(
  src: string,
  options: PrintIframeOptions<T>,
): void {
  // Serialized up front: a snapshot of the data at export time, and plain JSON
  // that survives structured cloning (reactive proxies would not).
  const payload = JSON.stringify(options.payload);

  // Mobile browsers (notably Chrome on Android) print the top-level document
  // instead of the iframe content, so the whole website ends up on the page.
  // Fall back to a dedicated top-level window where window.print() targets the
  // correct document. This must run synchronously inside the user gesture for
  // window.open() not to be blocked by the pop-up blocker.
  if (shouldUsePrintWindow()) {
    openPrintWindow(src, payload, options);
    return;
  }

  const { widthPx = 0, heightPx = 0 } = options;

  const iframe = document.createElement('iframe');
  iframe.src = src;

  // IMPORTANT: do not use display:none (print needs layout).
  // Use opacity:0 + fixed positioning so the iframe is invisible but rendered.
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = widthPx > 0 ? `${widthPx}px` : '0';
  iframe.style.height = heightPx > 0 ? `${heightPx}px` : '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  if (!iframe.contentWindow) {
    iframe.remove();
    options.onError?.('Unable to create the print frame.');
    return;
  }

  listenToPrintPage(iframe.contentWindow, payload, options, () =>
    iframe.remove(),
  );
}

function shouldUsePrintWindow(): boolean {
  // Primary target is Chrome on Android, but mobile browsers in general handle
  return Platform.is.mobile ?? false;
}

function openPrintWindow<T>(
  src: string,
  payload: string,
  options: PrintIframeOptions<T>,
): void {
  const printWindow = window.open(src, '_blank');
  if (!printWindow) {
    options.onError?.(
      'Unable to open the print window. Please allow pop-ups for this site and try again.',
    );
    return;
  }

  listenToPrintPage(printWindow, payload, options);
}

/**
 * Answers the print page's payload request once, then drops the payload, so it
 * only ever lives in memory. Only messages from `printPage` are trusted.
 */
function listenToPrintPage<T>(
  printPage: Window,
  payload: string,
  options: PrintIframeOptions<T>,
  onDone?: () => void,
): void {
  const { messagePrefix, onError, onAfterPrint } = options;
  let pending: string | null = payload;

  const cleanup = () => {
    pending = null;
    window.removeEventListener('message', onMessage);
    onDone?.();
  };

  const onMessage = (ev: MessageEvent) => {
    if (ev.source !== printPage || ev.origin !== window.location.origin) {
      return;
    }
    if (!ev.data || typeof ev.data !== 'object' || !('type' in ev.data)) {
      return;
    }

    switch (ev.data.type) {
      case `${messagePrefix}:REQUEST`:
        if (pending !== null) {
          printPage.postMessage(
            { type: `${messagePrefix}:PAYLOAD`, payload: pending },
            window.location.origin,
          );
          pending = null;
        }
        return;
      case `${messagePrefix}:ERROR`:
        onError?.(ev.data.error as string);
        cleanup();
        return;
      case `${messagePrefix}:AFTERPRINT`:
        onAfterPrint?.();
        cleanup();
    }
  };

  window.addEventListener('message', onMessage);
}
