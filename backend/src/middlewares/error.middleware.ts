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

const getCode = (err: unknown): string | undefined =>
  isObject(err) && typeof err.code === 'string' ? err.code : undefined;

// Prisma failures that indicate a bug or infrastructure problem rather than a
// faulty request. Their details must not leak to the client.
const isInternalPrismaError = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientUnknownRequestError ||
  err instanceof Prisma.PrismaClientValidationError ||
  err instanceof Prisma.PrismaClientRustPanicError ||
  err instanceof Prisma.PrismaClientInitializationError;

const toApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) {
    return err;
  }

  // `findUniqueOrThrow` and friends throw a known request error (e.g. P2025)
  // when the request targets a missing record — a client error, not a server
  // fault. Map it to a client error without exposing the raw Prisma message.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return new ApiError(
      httpStatus.BAD_REQUEST,
      statusToString(httpStatus.BAD_REQUEST),
      { cause: err },
    );
  }

  if (isInternalPrismaError(err)) {
    return new ApiError(httpStatus.INTERNAL_SERVER_ERROR, undefined, {
      cause: err,
    });
  }

  if (!isObject(err)) {
    const message = typeof err === 'string' ? err : undefined;

    return new ApiError(httpStatus.INTERNAL_SERVER_ERROR, message, {
      cause: err,
    });
  }

  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : httpStatus.INTERNAL_SERVER_ERROR;
  const message =
    typeof err.message === 'string' ? err.message : statusToString(statusCode);

  return new ApiError(statusCode, message, {
    cause: err,
    code: getCode(err),
  });
};

export const errorConverter: ErrorRequestHandler = (err, _req, _res, next) => {
  next(toApiError(err));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (!(err instanceof ApiError)) {
    res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    return;
  }

  const { statusCode } = err;
  // A fault's message describes an internal failure and must not reach the
  // client. The status code itself is safe to keep.
  const masked = err.isFault && config.env === 'production';
  const message = masked ? statusToString(statusCode) : err.message;
  // `toApiError` copies `code` off whatever was thrown, so a fault's code names
  // the internal cause (`ECONNREFUSED`, a driver code) just as its message
  // does — mask it on the same terms, or the masking is undone by it.
  const errorCode = masked ? undefined : err.code;

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(errorCode !== undefined && { errorCode }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (err.isFault) {
    logger.error(err);
  } else if (statusCode >= 500 || config.env === 'development') {
    logger.warn(err);
  }

  res.status(statusCode).send(response);
};
