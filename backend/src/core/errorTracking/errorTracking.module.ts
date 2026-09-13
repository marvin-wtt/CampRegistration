import type { CoreModule } from '#core/base/CoreModule';
import { createErrorTracker } from '#core/errorTracking/errorTracker.factory';
import { errorTrackingRegistry } from '#core/errorTracking/errorTracking.registry';
import config from '#config/index';
import logger from '#core/logger';

/**
 * Provides error tracking and nothing domain-specific. Listed first among
 * the core modules (see #modules) so every tracker is live — and its
 * reachability already logged — before any other module's `configure()`
 * runs and can fail.
 */
export class ErrorTrackingModule implements CoreModule {
  async configure() {
    const trackers = config.errorTracking.drivers.map(createErrorTracker);
    errorTrackingRegistry.configure(trackers);

    if (trackers.length === 0) {
      logger.info('Error tracking disabled: no tracker configured.');
      return;
    }

    logger.info(
      `Using error tracker(s): ${trackers.map((t) => t.name()).join(', ')}`,
    );

    await errorTrackingRegistry.checkAvailability();
  }
}
