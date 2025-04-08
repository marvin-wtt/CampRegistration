import type { Request } from 'express';
export * from './manager.guard.js';
export { default as admin } from './admin.guard.js';

export type GuardFn = (
  req: Request,
) => string | boolean | Promise<boolean | string>;

export const and = (...guardFns: GuardFn[]): GuardFn => {
  return async (req: Request) => {
    for (const fn of guardFns) {
      try {
        const result = await fn(req);

        if (result !== true) {
          return result;
        }
      } catch (ignored) {
        return false;
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
      } catch (ignored) {
        // noop
      }
    }

    // Return last error message on failure
    return result;
  };
};
