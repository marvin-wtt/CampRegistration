import type { RequestHandler } from 'express';
import type { BaseController } from '#core/base/BaseController';
import { requireModels } from '#middlewares/model.middleware';

export function controller<T extends BaseController>(
  instance: T,
  method: keyof T,
): RequestHandler[] {
  // Check at runtime to ensure it's actually a function
  const fn = instance[method];
  if (typeof fn !== 'function') {
    throw new Error(`"${String(method)}" is not a function!`);
  }
  return [requireModels, fn.bind(instance) as RequestHandler];
}
