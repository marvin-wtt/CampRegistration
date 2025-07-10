import config from '#config/index';
import logger from '#core/logger';
import { createApp } from './app.js';
import { boot, shutdown } from './boot.js';

async function main() {
  // Boot must happen before the app is created is it registers routes and middlewares
  await boot();

  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port.toString()}`);
  });

  const exitHandler = (err?: unknown) => {
    if (err) {
      logger.error(err);
    }
    server.close(() => {
      logger.info('HTTP server closed');
      shutdown()
        .catch((err: unknown) => {
          logger.error('Failed to shutdown', err);
        })
        .finally(() => {
          logger.close();
          process.exit(err ? 1 : 0);
        });
    });

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
  logger.error('Failed to start', err);
  process.exit(1);
});
