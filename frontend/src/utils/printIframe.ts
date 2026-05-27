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
