import type { ErrorRequestHandler } from 'express';
import { Prisma } from '#generated/prisma/client.js';
import httpStatus from 'http-status';
import config from '#config/index';
import logger from '#core/logger';
import ApiError from '#utils/ApiError';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const statusToString = (statusCode: number): string => {
  if (!(statusCode in httpStatus)) {
    return '';
  }

  return httpStatus[statusCode as keyof typeof httpStatus] as string;
};

const isPrismaError = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError ||
  err instanceof Prisma.PrismaClientUnknownRequestError ||
  err instanceof Prisma.PrismaClientValidationError ||
  err instanceof Prisma.PrismaClientRustPanicError ||
  err instanceof Prisma.PrismaClientInitializationError;

export const errorConverter: ErrorRequestHandler = (
  err: unknown,
  _req,
  _res,
  next,
) => {
  if (err instanceof ApiError) {
    next(err);
    return;
  }

  if (isPrismaError(err)) {
    const stack =
      isObject(err) && typeof err.stack === 'string' ? err.stack : undefined;
    next(
      new ApiError(httpStatus.INTERNAL_SERVER_ERROR, undefined, false, stack),
    );
    return;
  }

  if (!isObject(err)) {
    const message = typeof err === 'string' ? err : undefined;

    next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, message, false));
    return;
  }

  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : httpStatus.INTERNAL_SERVER_ERROR;
  const message =
    typeof err.message === 'string' ? err.message : statusToString(statusCode);
  const stack = typeof err.stack === 'string' ? err.stack : undefined;
  const isOperationalError = statusCode >= 400 && statusCode < 500;

  next(new ApiError(statusCode, message, isOperationalError, stack));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (!(err instanceof ApiError)) {
    res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    return;
  }

  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (!err.isOperational) {
    logger.error(err);
  } else if (config.env === 'development') {
    logger.warn(err);
  }

  res.status(statusCode).send(response);
};
