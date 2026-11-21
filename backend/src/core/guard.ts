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

export const ADMIN_TWO_FACTOR_REQUIRED = 'ADMIN_2FA_REQUIRED';

const hasAdminRole = (req: Request): boolean => {
  return (
    req.user !== undefined &&
    'role' in req.user &&
    typeof req.user.role === 'string' &&
    req.user.role.toLowerCase() === 'admin'
  );
};

// `req.user` is loaded with `twoFactor.confirmedAt` by the JWT strategy.
const hasTwoFactor = (req: Request): boolean => {
  const twoFactor: unknown =
    req.user !== undefined && 'twoFactor' in req.user
      ? req.user.twoFactor
      : null;

  return (
    typeof twoFactor === 'object' &&
    twoFactor !== null &&
    'confirmedAt' in twoFactor &&
    twoFactor.confirmedAt != null
  );
};

// The administrator role grants nothing without two-factor authentication.
export const admin = (req: Request): boolean => {
  return hasAdminRole(req) && hasTwoFactor(req);
};

export const ADMIN_ACCESS_REQUIRED = 'ADMIN_ACCESS_REQUIRED';

// Requests where a scoped check would have passed with an access grant.
const adminAccessMissing = new WeakSet<Request>();

export function markAdminAccessRequired(req: Request): void {
  adminAccessMissing.add(req);
}

/**
 * Middleware to guard the access to a route.
 * Multiple guards can be combined by using the 'and', and 'or' guard.
 *
 * Without a guard function, only administrators pass. With one, administrators
 * are judged like everyone else: their role reaches an event, newsletter or
 * organization only through an access grant, checked by the scoped guards.
 *
 * @param guardFn The guard function or a wrapper function (and, or)
 */
export const guard = (guardFn: GuardFn = admin) => {
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

    // Tells an administrator why their role didn't apply, so the client can
    // send them to the setup instead of showing a bare 403.
    if (hasAdminRole(req) && !hasTwoFactor(req)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Administrator access requires two-factor authentication',
        { code: ADMIN_TWO_FACTOR_REQUIRED },
      );
    }

    if (adminAccessMissing.has(req)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Administrator access to this resource must be requested first',
        { code: ADMIN_ACCESS_REQUIRED },
      );
    }

    throw new ApiError(httpStatus.FORBIDDEN, message);
  });
};
