import ApiError from "./ApiError";

export const verifyModelExists = <T>(
  model: T | undefined | null
): T | never => {
  if (model != null) {
    return model;
  }

  throw new ApiError(404, "Model not found");
};
