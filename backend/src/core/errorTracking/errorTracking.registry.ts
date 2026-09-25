import type {
  ErrorContext,
  ErrorTracker,
} from '#core/errorTracking/errorTracker.types';
import logger from '#core/logger';

/**
 * Fans out captured exceptions to every configured tracker. A plain
 * module-level singleton rather than an injectable service: it must be
 * reachable from the logger's transport (core/errorTracking/errorTracking.transport.ts),
 * which is wired up long before the DI container boots.
 *
 * Failures here are logged with `warn`, never `error` — `error` is what
 * feeds this registry in the first place, and logging a tracker's own
 * failure at that level would just capture it again.
 */
class ErrorTrackingRegistry {
  private trackers: ErrorTracker[] = [];

  configure(trackers: ErrorTracker[]) {
    this.trackers = trackers;
  }

  captureException(error: unknown, context?: ErrorContext): void {
    for (const tracker of this.trackers) {
      try {
        void Promise.resolve(tracker.captureException(error, context)).catch(
          (err: unknown) => {
            this.logFailure(tracker, err);
          },
        );
      } catch (err) {
        this.logFailure(tracker, err);
      }
    }
  }

  async checkAvailability(): Promise<void> {
    for (const tracker of this.trackers) {
      if (!tracker.isAvailable) {
        continue;
      }

      try {
        const available = await tracker.isAvailable();
        if (available) {
          logger.info(`Error tracker '${tracker.name()}' is reachable.`);
        } else {
          logger.warn(
            `Error tracker '${tracker.name()}' is not reachable. Errors may not be reported.`,
          );
        }
      } catch (err) {
        logger.warn(
          `Error tracker '${tracker.name()}' availability check failed.`,
          err,
        );
      }
    }
  }

  private logFailure(tracker: ErrorTracker, err: unknown) {
    logger.warn(
      `Error tracker '${tracker.name()}' failed to capture an exception.`,
      err,
    );
  }
}

export const errorTrackingRegistry = new ErrorTrackingRegistry();
