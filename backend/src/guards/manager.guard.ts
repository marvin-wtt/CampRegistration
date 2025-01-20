import managerService from '#app/manager/manager.service';
import { Request } from 'express';
import { routeModel } from '#utils/verifyModel';
import { authUserId } from '#utils/authUserId';

export const campManager = async (req: Request): Promise<boolean | string> => {
  const userId = authUserId(req);
  const campId = routeModel(req.models.camp).id;

  const manager = await managerService.getManagerByUserId(campId, userId);

  if (manager === null) {
    return false;
  }

  return manager.expiresAt === null || manager.expiresAt > new Date();
};

export const campActive = async (req: Request): Promise<boolean | string> => {
  return routeModel(req.models.camp).active;
};
