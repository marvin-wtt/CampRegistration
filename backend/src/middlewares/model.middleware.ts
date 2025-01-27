import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';

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
