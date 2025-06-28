import type { Request } from 'express';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
export * from './manager.guard.js';
export { default as admin } from './admin.guard.js';

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
