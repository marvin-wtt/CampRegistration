import { Request } from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { catchMiddlewareAsync } from '#utils/catchAsync';
import { GuardFn, or, admin } from '#guards/index';

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

  return catchMiddlewareAsync(async (req: Request) => {
    let message = 'Insufficient permissions';

    const result = await guardFn(req);
    if (result === true) {
      return;
    }

    if (typeof result === 'string') {
      message = result;
    }

    if (req.isUnauthenticated()) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthenticated');
    }

    throw new ApiError(httpStatus.FORBIDDEN, message);
  });
};

export default guard;
