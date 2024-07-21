import { NextFunction, Request, Response } from 'express';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { catchRequestAsync } from 'utils/catchAsync';

type GuardFn = (req: Request) => Promise<boolean | string>;
/**
 * Middleware to guard the access to a route.
 * At least one guard must be true to gain access.
 * Administrations always have access.
 *
 * @param guardFns The guard function or an empty array if only administrators should have access
 */
const guard = (guardFns: GuardFn | GuardFn[] = []) => {
  guardFns = Array.isArray(guardFns) ? guardFns : [guardFns];

  return catchRequestAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      let message = 'Insufficient permissions';
      for (const fn of guardFns) {
        let result: string | boolean = false;

        try {
          result = await fn(req);
        } catch (e: unknown) {
          result = e instanceof Error ? e.message : false;
        }

        if (result === true) {
          next();
          return;
        }

        if (typeof result === 'string') {
          message = result;
        }
      }

      if (req.isUnauthenticated()) {
        next(new ApiError(httpStatus.UNAUTHORIZED, 'Unauthenticated'));
        return;
      }

      next(new ApiError(httpStatus.FORBIDDEN, message));
    },
  );
};

export default guard;
