import { Request } from "express";
import { campManagerService } from "../services";

export const isCampManager = async (req: Request): Promise<boolean | string> => {
  if (!req.user || !("id" in req.user) || typeof req.user.id !== "string") {
    return "Unauthenticated";
  }

  if (!("campId" in req.params) || typeof req.params.campId !== "string") {
    return "Invalid camp parameter";
  }

  const userId = req.user.id;
  const campId = req.params.campId;

  return await campManagerService.campManagerExistsWithUserIdAndCampId(campId, userId);
};

export default {
  isCampManager,
};
