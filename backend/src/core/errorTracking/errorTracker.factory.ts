import type { ErrorTracker } from '#core/errorTracking/errorTracker.types';
import { SentryTracker } from '#core/errorTracking/sentry.tracker';

// Available error tracker drivers
const trackers: Record<string, new () => ErrorTracker> = {
  sentry: SentryTracker,
};

export function createErrorTracker(driver: string): ErrorTracker {
  if (driver in trackers) {
    const cls = trackers[driver];

    return new cls();
  }

  throw new Error(
    `Invalid error tracker driver '${driver}'. Available: ${Object.keys(trackers).join(', ')}`,
  );
}
