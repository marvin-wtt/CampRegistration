import { Platform } from 'quasar';

export interface PrintIframeOptions {
  messagePrefix: string;
  widthPx?: number;
  heightPx?: number;
  onError?: (error: string) => void;
  onAfterPrint?: () => void;
}

export function openPrintIframe(
  src: string,
  options: PrintIframeOptions,
): void {
  // Mobile browsers (notably Chrome on Android) print the top-level document
  // instead of the iframe content, so the whole website ends up on the page.
  // Fall back to a dedicated top-level window where window.print() targets the
  // correct document. This must run synchronously inside the user gesture for
  // window.open() not to be blocked by the pop-up blocker.
  if (shouldUsePrintWindow()) {
    openPrintWindow(src, options);
    return;
  }

  const {
    messagePrefix,
    widthPx = 0,
    heightPx = 0,
    onError,
    onAfterPrint,
  } = options;

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

  const onMessage = (ev: MessageEvent) => {
    if (ev.origin !== window.location.origin) {
      return;
    }
    if (!ev.data || typeof ev.data !== 'object' || !('type' in ev.data)) {
      return;
    }

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      iframe.remove();
    };

    if (ev.data.type === `${messagePrefix}:ERROR`) {
      onError?.(ev.data.error as string);
      cleanup();
      return;
    }

    if (ev.data.type === `${messagePrefix}:AFTERPRINT`) {
      onAfterPrint?.();
      cleanup();
    }
  };

  window.addEventListener('message', onMessage);
}

function shouldUsePrintWindow(): boolean {
  // Primary target is Chrome on Android, but mobile browsers in general handle
  return Platform.is.mobile ?? false;
}

function openPrintWindow(src: string, options: PrintIframeOptions): void {
  const { messagePrefix, onError, onAfterPrint } = options;

  const printWindow = window.open(src, '_blank');
  if (!printWindow) {
    onError?.(
      'Unable to open the print window. Please allow pop-ups for this site and try again.',
    );
    return;
  }

  const onMessage = (ev: MessageEvent) => {
    // Only react to messages coming from the window we opened.
    if (ev.source !== printWindow) {
      return;
    }
    if (ev.origin !== window.location.origin) {
      return;
    }
    if (!ev.data || typeof ev.data !== 'object' || !('type' in ev.data)) {
      return;
    }

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
    };

    if (ev.data.type === `${messagePrefix}:ERROR`) {
      onError?.(ev.data.error as string);
      cleanup();
      return;
    }

    if (ev.data.type === `${messagePrefix}:AFTERPRINT`) {
      onAfterPrint?.();
      cleanup();
    }
  };

  window.addEventListener('message', onMessage);
}
