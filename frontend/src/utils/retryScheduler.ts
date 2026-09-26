import { retryAfterMs } from '@/utils/retryAfter';

const BASE_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 60_000;

export interface RetryScheduler {
  /**
   * Schedules `task` after an exponential backoff (or the server's
   * Retry-After, when present on `error`), replacing any retry this same
   * scheduler already had pending. `onFirstAttempt` fires only when this call
   * starts a new retry sequence (the first failure since the last `stop()`),
   * not on every reschedule.
   */
  schedule(
    task: () => Promise<unknown>,
    error: unknown,
    onFirstAttempt?: () => void,
  ): void;
  /** Cancels any pending retry and resets the backoff. */
  stop(): void;
}

// One independent timer/attempt-count pair per scheduler instance, so
// unrelated retry loops (e.g. cold-start session restoration vs. proactive
// background refresh) never cancel or reset each other's backoff.
export function createRetryScheduler(): RetryScheduler {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;

  function stop() {
    clearTimeout(timer);
    timer = undefined;
    attempt = 0;
  }

  function schedule(
    task: () => Promise<unknown>,
    error: unknown,
    onFirstAttempt?: () => void,
  ) {
    if (attempt === 0) {
      onFirstAttempt?.();
    }

    const delay =
      retryAfterMs(error) ??
      Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
    attempt++;

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void task();
    }, delay);
  }

  return { schedule, stop };
}
