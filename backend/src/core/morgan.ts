import type { Response } from 'express';
import morgan from 'morgan';
import config from '#config/index';
import logger from '#core/logger';

const extractMessage = (res: Response): string | undefined => {
  if (
    'errorMessage' in res.locals &&
    typeof res.locals.errorMessage === 'string'
  ) {
    return res.locals.errorMessage;
  }

  return undefined;
};

morgan.token('message', (_req, res: Response) => extractMessage(res) ?? '');

const getIpFormat = () =>
  config.env === 'production' ? ':remote-addr - ' : '';
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const isTest = config.env === 'test';

export const successHandler = morgan(successResponseFormat, {
  skip: (_req, res) => isTest || res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

export const clientErrorHandler = morgan(successResponseFormat, {
  skip: (_req, res) => isTest || res.statusCode < 400 || res.statusCode >= 500,
  stream: { write: (message) => logger.warn(message.trim()) },
});

export const serverErrorHandler = morgan(errorResponseFormat, {
  skip: (_req, res) => isTest || res.statusCode < 500,
  stream: { write: (message) => logger.error(message.trim()) },
});
