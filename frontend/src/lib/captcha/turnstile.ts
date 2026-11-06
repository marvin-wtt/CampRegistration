const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  execution?: 'render' | 'execute';
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'auto' | 'never';
  theme?: 'auto' | 'light' | 'dark';
  language?: string;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
  callback?: (token: string) => void;
  'error-callback'?: (code: string) => boolean | void;
  'timeout-callback'?: () => void;
}

export interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | undefined;

export function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error('Turnstile did not initialise'));
      }
    };
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // Allow a later attempt, e.g. after a blocker was disabled.
    loading = undefined;
    throw error;
  });

  return loading;
}
