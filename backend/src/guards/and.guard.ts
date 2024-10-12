import { Request } from 'express';
import { GuardFn } from './index';

const and = (...guardFns: GuardFn[]): GuardFn => {
  return async (req: Request) => {
    for (const fn of guardFns) {
      try {
        const result = await fn(req);

        if (result !== true) {
          return result;
        }
      } catch (error) {
        return false;
      }
    }

    return true;
  };
};

export default and;
