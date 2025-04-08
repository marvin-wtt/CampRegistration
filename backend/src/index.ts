import type { Server } from 'http';
import app from './app.js';
import prisma from './client.js';
import config from '#config/index';
import logger from '#core/logger';

let server: Server | undefined;
await prisma.$connect().then(() => {
  logger.info('Connected to SQL Database');
  // TODO Error handling
  server = app.listen(config.port, '', () => {
    logger.info(`Listening to port ${config.port.toString()}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      logger.close();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
