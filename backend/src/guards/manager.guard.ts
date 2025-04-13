import managerService from '#app/manager/manager.service';
import type { Request } from 'express';

export const campManager = async (req: Request): Promise<boolean | string> => {
  const userId = req.authUserId();
  const campId = req.modelOrFail('camp').id;

  const manager = await managerService.getManagerByUserId(campId, userId);

  if (manager === null) {
    return false;
  }

  return manager.expiresAt === null || manager.expiresAt > new Date();
};

export const campActive = (req: Request): boolean | string => {
  return req.modelOrFail('camp').active;
};
