import * as Sentry from '@sentry/node';
import type { ErrorTracker } from '#core/errorTracking/errorTracker.types';
import ApiError from '#utils/ApiError';
import config from '#config/index';

export class SentryTracker implements ErrorTracker {
  constructor() {
    Sentry.init({
      dsn: config.errorTracking.sentry.dsn,
      environment: config.env,
      sendDefaultPii: false,
      beforeSend(event, hint) {
        const err = hint.originalException;
        if (err instanceof ApiError && !err.isFault) {
          return null;
        }
        return event;
      },
    });
  }

  name(): string {
    return 'Sentry';
  }

  captureException(error: unknown): void {
    Sentry.captureException(error);
  }

  // Sentry has no ping endpoint, so this only confirms the ingest host is
  // reachable (DNS + TCP/TLS) rather than that the DSN itself is valid.
  async isAvailable(): Promise<boolean> {
    if (!config.errorTracking.sentry.dsn) {
      return false;
    }

    try {
      const { origin } = new URL(config.errorTracking.sentry.dsn);
      const response = await fetch(origin, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      return response.status < 500;
    } catch {
      return false;
    }
  }
}
