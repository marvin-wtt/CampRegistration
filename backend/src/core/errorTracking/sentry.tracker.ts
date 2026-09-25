import * as Sentry from '@sentry/node';
import type {
  ErrorContext,
  ErrorTracker,
} from '#core/errorTracking/errorTracker.types';
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

  captureException(error: unknown, context?: ErrorContext): void {
    const job = context?.job;
    if (!job) {
      Sentry.captureException(error);
      return;
    }

    Sentry.captureException(error, {
      tags: {
        'job.source': job.source,
        'job.queue': job.queue,
        'job.name': job.name,
      },
      contexts: { job: { ...job } },
    });
  }

  // Sentry has no ping endpoint, so this only confirms the ingest host is
  // reachable (DNS + TCP/TLS) rather than that the DSN itself is valid.
  async isAvailable(): Promise<boolean> {
    const { dsn } = config.errorTracking.sentry;
    if (!dsn || dsn.trim().length === 0) {
      return false;
    }

    try {
      const { origin } = new URL(dsn);
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
