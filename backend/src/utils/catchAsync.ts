import { RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { RequestParamHandler } from 'express-serve-static-core';
import ApiError from './ApiError';
import httpStatus from 'http-status';

// TODO Can be removed with express v5.x
export const catchRequestAsync =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

export const catchMiddlewareAsync =
  (fn: (req: Request, res: Response) => Promise<void> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res))
      .then(() => next())
      .catch((err) => next(err));
  };

type CustomRequestParamHandler = (
  req: Request,
  res: Response,
  value: string,
) => Promise<void> | void;

export const catchParamAsync =
  (fn: CustomRequestParamHandler) =>
  (
    req: Request,
    res: Response,
    next: NextFunction,
    value: unknown,
    name: string,
  ) => {
    if (typeof value !== 'string') {
      return next(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid request param value for param ${name}.`,
        ),
      );
    }

    Promise.resolve(fn(req, res, value))
      .then(() => next())
      .catch((err) => next(err));
  };
