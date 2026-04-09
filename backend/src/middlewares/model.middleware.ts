import type { RequestHandler } from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { isRegisteredModel } from '#core/router/router';

export const routeModel = <T>(model: T): NonNullable<T> => {
  if (model == null) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Route model not found');
  }

  return model;
};

export const verifyModel = <T>(
  model: T | undefined | null,
): NonNullable<T> | never => {
  if (model == null) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }

  return model;
};

/**
 * Middleware that verifies every route model inferred from the current request
 * params.  For each param ending in "Id" (e.g. "campId", "roomId") it derives
 * the model key ("camp", "room") and throws a 404 when a registered binding
 * did not resolve that model.
 */
export const requireModels: RequestHandler = (req, _res, next) => {
  for (const paramKey of Object.keys(req.params)) {
    if (!paramKey.endsWith('Id')) {
      continue;
    }

    const modelKey = paramKey.slice(0, -'Id'.length); // "campId" → "camp"
    if (isRegisteredModel(modelKey)) {
      routeModel(req.model(modelKey));
    }
  }
  next();
};
