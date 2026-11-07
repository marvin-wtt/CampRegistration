import type { Request, Response, NextFunction } from 'express';

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
