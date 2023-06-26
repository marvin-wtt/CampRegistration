import { managerService } from "../services";
import { Request } from "express-serve-static-core";
import { routeModel } from "../utils/verifyModel";
import authUserId from "../utils/authUserId";

export const campManager = async (req: Request): Promise<boolean | string> => {
  let userId = "";
  try {
    userId = authUserId(req);
  } catch (error) {
    return "Unauthenticated";
  }

  const campId = routeModel(req.models.camp).id;

  return await managerService.campManagerExistsWithUserIdAndCampId(
    campId,
    userId
  );
};

export const campPublic = async (req: Request): Promise<boolean | string> => {
  return routeModel(req.models.camp).public;
};
