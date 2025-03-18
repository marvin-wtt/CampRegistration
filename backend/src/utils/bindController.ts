import type { BaseController } from '#core/BaseController';

export function controller<T extends BaseController, K extends keyof T>(
  instance: T,
  method: K,
) {
  // Check at runtime to ensure it's actually a function
  const fn = instance[method];
  if (typeof fn !== 'function') {
    throw new Error(`"${String(method)}" is not a function!`);
  }
  // Now the compiler allows you to bind it
  return fn.bind(instance) as T[K];
}
