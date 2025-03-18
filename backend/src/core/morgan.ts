import type { Response } from 'express';
import morgan from 'morgan';
import config from '#config/index';
import logger from '#core/logger';

morgan.token('message', (_req, res: Response) => res.locals.errorMessage || '');

const getIpFormat = () =>
  config.env === 'production' ? ':remote-addr - ' : '';
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const isTest = config.env === 'test';

export const successHandler = morgan(successResponseFormat, {
  skip: (_req, res) => isTest || res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

export const errorHandler = morgan(errorResponseFormat, {
  skip: (_req, res) => isTest || res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

export default {
  successHandler,
  errorHandler,
};
