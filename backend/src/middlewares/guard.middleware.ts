import { NextFunction, Request, Response } from 'express';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { catchRequestAsync } from 'utils/catchAsync';
import { GuardFn, or, admin } from 'guards';

/**
 * Middleware to guard the access to a route.
 * Multiple guards can be combined by using the 'and', and 'or' guard.
 *
 * @param guardFn The guard function or a wrapper function (and, or)
 */
const guard = (guardFn?: GuardFn) => {
  // Always grand access to administrators
  // When no guard is defined, only administrators have access
  guardFn = guardFn ? or(admin, guardFn) : admin;

  return catchRequestAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      let message = 'Insufficient permissions';

      const result = await guardFn(req);
      if (result === true) {
        return next();
      }

      if (req.isUnauthenticated()) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Unauthenticated'));
      }

      next(new ApiError(httpStatus.FORBIDDEN, message));
    },
  );
};

export default guard;
