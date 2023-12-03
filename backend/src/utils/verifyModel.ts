import ApiError from "./ApiError";
import httpStatus from "http-status";

export const routeModel = <T>(model: T): NonNullable<T> => {
  /* c8 ignore next 3 */
  if (model == null) {
    throw new ApiError(httpStatus.NOT_FOUND, "Route model not found");
  }

  return model;
};

export const verifyModelExists = <T>(
  model: T | undefined | null,
): T | never => {
  if (model != null) {
    return model;
  }

  throw new ApiError(httpStatus.NOT_FOUND, "Model not found");
};
