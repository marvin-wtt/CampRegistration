import type { CaptchaAction } from '@camp-registration/common/captcha';

// What every driver's challenge component exposes to `CaptchaWidget`. It also
// takes an `action` prop and reports `v-model:interactive` while it waits for
// the visitor.
export interface CaptchaChallenge {
  // Tokens are single-use, so every call solves a fresh one.
  getToken(): Promise<string>;
}

// Resolves `undefined` while the backend has bot protection off.
type TokenSource = () => Promise<string | undefined>;

// Mounted widgets, so a request can solve a token without the page or store
// passing one along.
const sources = new Map<CaptchaAction, TokenSource>();
const waiting = new Map<CaptchaAction, ((source: TokenSource) => void)[]>();

// A widget may mount as part of the submit that needs it (e.g. inside a
// status card that appears on submit), so give it a moment to register.
const REGISTRATION_GRACE_MS = 1000;

export function registerCaptcha(
  action: CaptchaAction,
  source: TokenSource,
): () => void {
  sources.set(action, source);
  waiting.get(action)?.forEach((resolve) => resolve(source));
  waiting.delete(action);

  return () => {
    if (sources.get(action) === source) {
      sources.delete(action);
    }
  };
}

export async function solveCaptcha(
  action: CaptchaAction,
): Promise<string | undefined> {
  const source = sources.get(action) ?? (await waitForSource(action));

  return source();
}

function waitForSource(action: CaptchaAction): Promise<TokenSource> {
  return new Promise((resolve, reject) => {
    const onRegister = (source: TokenSource) => {
      clearTimeout(timer);
      resolve(source);
    };
    const timer = setTimeout(() => {
      const queue = waiting.get(action)?.filter((fn) => fn !== onRegister);
      if (queue?.length) {
        waiting.set(action, queue);
      } else {
        waiting.delete(action);
      }
      reject(new Error(`No captcha widget is mounted for "${action}".`));
    }, REGISTRATION_GRACE_MS);

    waiting.set(action, [...(waiting.get(action) ?? []), onRegister]);
  });
}
