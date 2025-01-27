import managerService from '#app/manager/manager.service';
import { Request } from 'express';

export const campManager = async (req: Request): Promise<boolean | string> => {
  const userId = req.authUserId();
  const campId = req.modelOrFail('camp').id;

  const manager = await managerService.getManagerByUserId(campId, userId);

  if (manager === null) {
    return false;
  }

  return manager.expiresAt === null || manager.expiresAt > new Date();
};

export const campActive = async (req: Request): Promise<boolean | string> => {
  return req.modelOrFail('camp').active;
};
