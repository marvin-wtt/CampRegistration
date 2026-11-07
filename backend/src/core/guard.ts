import type { Request } from 'express';
import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import { catchMiddlewareAsync } from '#core/router/catchAsync';

export type GuardFn = (
  req: Request,
) => string | boolean | Promise<boolean | string>;

const authErrorSet = new Set<number>([
  httpStatus.UNAUTHORIZED,
  httpStatus.PAYMENT_REQUIRED,
  httpStatus.FORBIDDEN,
]);
function isAuthError(error: unknown): error is ApiError {
  return error instanceof ApiError && authErrorSet.has(error.statusCode);
}

export const and = (...guardFns: GuardFn[]): GuardFn => {
  return async (req: Request) => {
    for (const fn of guardFns) {
      try {
        const result = await fn(req);

        if (result !== true) {
          return result;
        }
      } catch (error) {
        if (isAuthError(error)) {
          return error.message;
        }

        throw error;
      }
    }

    return true;
  };
};

export const or = (...guardFns: GuardFn[]): GuardFn => {
  return async (req: Request) => {
    let result: string | boolean = false;
    for (const fn of guardFns) {
      try {
        result = await fn(req);
        if (result === true) {
          return true;
        }
      } catch (error) {
        if (isAuthError(error)) {
          result = error.message;
          continue;
        }

        throw error;
      }
    }

    // Return last error message on failure
    return result;
  };
};

export const admin = (req: Request): boolean | string => {
  return (
    req.user !== undefined &&
    'role' in req.user &&
    typeof req.user.role === 'string' &&
    req.user.role.toLowerCase() === 'admin'
  );
};

/**
 * Middleware to guard the access to a route.
 * Multiple guards can be combined by using the 'and', and 'or' guard.
 *
 * @param guardFn The guard function or a wrapper function (and, or)
 */
export const guard = (guardFn?: GuardFn) => {
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
