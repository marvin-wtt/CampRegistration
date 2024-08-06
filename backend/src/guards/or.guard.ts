import { GuardFn } from './index';
import { Request } from 'express';

const or = (...guardFns: GuardFn[]): GuardFn => {
  return async (req: Request) => {
    let result: string | boolean = false;
    for (const fn of guardFns) {
      try {
        result = await fn(req);
        if (result === true) {
          return true;
        }
      } catch (ignored) {
        /* tslint:disable:no-empty */
      }
    }

    // Return last error message on failure
    return result;
  };
};

export default or;
