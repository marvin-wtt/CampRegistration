import type { Request } from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
export {
  registrationOpen,
  campManager,
} from '#app/campManager/camp-manager.guard';

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
