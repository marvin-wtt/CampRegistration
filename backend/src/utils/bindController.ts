import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { BaseController } from '#core/base/BaseController';
import { routeModel } from '#middlewares/model.middleware';
import { isRegisteredModel } from '#core/router/router';

export function controller<T extends BaseController, K extends keyof T>(
  instance: T,
  method: K,
): RequestHandler {
  // Check at runtime to ensure it's actually a function
  const fn = instance[method];
  if (typeof fn !== 'function') {
    throw new Error(`"${String(method)}" is not a function!`);
  }

  const bound = fn.bind(instance) as (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => unknown;

  return (req: Request, res: Response, next: NextFunction) => {
    // For every route param ending in "Id" (e.g. "campId", "roomId"), derive
    // the model key ("camp", "room") and fail with 404 when a registered
    // binding did not resolve the model.  This prevents controllers from being
    // reached with a missing parent/child resource regardless of whether they
    // call modelOrFail themselves.
    for (const paramKey of Object.keys(req.params)) {
      if (paramKey.endsWith('Id')) {
        const modelKey = paramKey.slice(0, -2); // "campId" → "camp"
        if (isRegisteredModel(modelKey)) {
          routeModel(req.model(modelKey));
        }
      }
    }

    return bound(req, res, next);
  };
}
