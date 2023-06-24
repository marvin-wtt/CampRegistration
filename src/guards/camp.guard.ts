import { campManagerService } from "../services";
import { Request } from "express-serve-static-core";

export const campManager = async (
  req: Request
): Promise<boolean | string> => {
  if (!req.user || !("id" in req.user) || typeof req.user.id !== "string") {
    return "Unauthenticated";
  }

  if (!("campId" in req.params) || typeof req.params.campId !== "string") {
    return "Invalid camp parameter";
  }

  const userId = req.user.id;
  const campId = req.params.campId;

  return await campManagerService.campManagerExistsWithUserIdAndCampId(
    campId,
    userId
  );
};

export const campPublic = async (req: Request): Promise<boolean | string> => {
  return req.models.camp.public;
};
