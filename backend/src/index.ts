import * as Sentry from '@sentry/node';
import config from '#config/index';
import logger from '#core/logger';
import { createApp } from './app.js';
import { boot, shutdown } from './boot.js';
import ApiError from '#utils/ApiError';

async function main() {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.env,
      sendDefaultPii: false,
      beforeSend(event, hint) {
        const err = hint.originalException;
        if (err instanceof ApiError && err.isOperational) {
          return null;
        }
        return event;
      },
    });
  }

  // Boot must happen before the app is created is it registers routes and middlewares
  await boot();

  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port.toString()}`);
  });

  const exitHandler = (signalOrErr?: unknown) => {
    // Signal handlers pass the signal name (a string); the crash handlers
    // (uncaughtException/unhandledRejection) pass an Error. Only the latter is
    // an actual failure — a plain SIGTERM/SIGINT is a normal shutdown.
    const isError = signalOrErr instanceof Error;
    if (isError) {
      logger.error(signalOrErr);
    } else if (typeof signalOrErr === 'string') {
      logger.info(`Received ${signalOrErr}, shutting down`);
    }

    server.close(() => {
      logger.info('HTTP server closed');
      shutdown()
        .catch((err: unknown) => {
          logger.error('Failed to shutdown', err);
        })
        .finally(() => {
          logger.close();
          process.exit(isError ? 1 : 0);
        });
    });

    // Drop idle keep-alive sockets right away so they don't hold the server open.
    server.closeIdleConnections();

    // Long-lived SSE realtime streams (text/event-stream, keep-alive) never end
    // on their own, so server.close() would otherwise wait forever for them and
    // its callback — and thus shutdown() — would never run. Give normal in-flight
    // requests a grace window to drain, then force-drop whatever's left (SSE
    // streams, stuck requests) so the close callback can fire.
    setTimeout(() => {
      server.closeAllConnections();
    }, 5_000).unref();

    setTimeout(() => {
      logger.error('Forcing process exit');
      logger.close();
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('uncaughtException', exitHandler);
  process.on('unhandledRejection', exitHandler);

  process.on('SIGINT', exitHandler);
  process.on('SIGTERM', exitHandler);
}

main().catch((err: unknown) => {
  logger.error('Failed to start:', err);
  process.exit(1);
});
