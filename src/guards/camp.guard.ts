import { managerService } from "../services";
import { Request } from "express-serve-static-core";
import { routeModel } from "../utils/verifyModel";

export const campManager = async (req: Request): Promise<boolean | string> => {
  if (
    req.isUnauthenticated() ||
    !req.user ||
    !("id" in req.user) ||
    typeof req.user.id !== "string"
  ) {
    return "Unauthenticated";
  }

  if (!("campId" in req.params) || typeof req.params.campId !== "string") {
    return "Invalid camp parameter";
  }

  // TODO Extract information from camp request model (req.models.camp)
  const userId = req.user.id;
  const campId = req.params.campId;

  return await managerService.campManagerExistsWithUserIdAndCampId(
    campId,
    userId
  );
};

export const campPublic = async (req: Request): Promise<boolean | string> => {
  return routeModel(req.models.camp).public;
};
