import { RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { RequestParamHandler } from 'express-serve-static-core';

// TODO Can be removed with express v5.x
export const catchRequestAsync =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

export const catchParamAsync =
  (fn: RequestParamHandler) =>
  (
    req: Request,
    res: Response,
    next: NextFunction,
    value: unknown,
    name: string,
  ) => {
    Promise.resolve(fn(req, res, next, value, name)).catch((err) => next(err));
  };
