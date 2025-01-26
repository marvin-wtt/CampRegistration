import { NextFunction, Request, Response } from 'express';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';

export default (req: Request, _res: Response, next: NextFunction) => {
  // Initialize models
  req.models = {};

  // eslint-disable-next-line security/detect-object-injection
  req.model = (key) => req.models[key];
  req.modelOrFail = (key) => routeModel(req.model(key));
  // eslint-disable-next-line security/detect-object-injection
  req.setModel = (key, value) => (req.models[key] = value);
  req.setModelOrFail = (key, value) => req.setModel(key, verifyModel(value));

  next();
};

export const routeModel = <T>(model: T): NonNullable<T> => {
  /* c8 ignore next 3 */
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
