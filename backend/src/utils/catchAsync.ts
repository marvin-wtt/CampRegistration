import type { Request, Response, NextFunction } from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';

// These are convenience methods to make them more robust
//  Since express 5, express handles async await and these methods are no longer required
export const catchMiddlewareAsync =
  (fn: (req: Request, res: Response) => Promise<void> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res))
      .then(() => {
        next();
      })
      .catch((err: unknown) => {
        next(err);
      });
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
      next(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid request param value for param ${name}.`,
        ),
      );
      return;
    }

    Promise.resolve(fn(req, res, value))
      .then(() => {
        next();
      })
      .catch((err: unknown) => {
        next(err);
      });
  };
