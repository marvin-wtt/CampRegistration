import ApiError from "./ApiError";

export const routeModel = <T>(model: T): NonNullable<T> => {
  if (model == null) {
    throw new ApiError(404, "Route model not found");
  }

  return model;
};

export const verifyModelExists = <T>(
  model: T | undefined | null
): T | never => {
  if (model != null) {
    return model;
  }

  throw new ApiError(404, "Model not found");
};
