import managerService from '#app/manager/manager.service';
import { Request } from 'express';
import { routeModel } from '#utils/verifyModel';
import { authUserId } from '#utils/authUserId';

export const campManager = async (req: Request): Promise<boolean | string> => {
  const userId = authUserId(req);
  const campId = routeModel(req.models.camp).id;

  return await managerService.campManagerExistsWithUserIdAndCampId(
    campId,
    userId,
  );
};

export const campActive = async (req: Request): Promise<boolean | string> => {
  return routeModel(req.models.camp).active;
};
