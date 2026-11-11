import type { App } from 'vue';
import { defineBoot } from '#q-app';
import { isReportedError } from '@/utils/reportedError';

// A failed request the user was already told about rejects so that follow-ups
// are skipped; it must not surface again as an unhandled error. This covers
// `void store.x()` and dialogs, which are mounted outside PageStateHandler.
export function installReportedErrorHandling(app: App, target: Window) {
  const previous = app.config.errorHandler;
  app.config.errorHandler = (err, instance, info) => {
    if (isReportedError(err)) {
      // eslint-disable-next-line no-console
      console.warn('Reported error:', err);
      return;
    }
    if (previous) {
      previous(err, instance, info);
      return;
    }
    // eslint-disable-next-line no-console
    console.error(err);
  };

  target.addEventListener('unhandledrejection', (event) => {
    if (isReportedError(event.reason)) {
      event.preventDefault();
      // eslint-disable-next-line no-console
      console.warn('Reported error:', event.reason);
    }
  });
}

export default defineBoot(({ app }) => {
  installReportedErrorHandling(app, window);
});
