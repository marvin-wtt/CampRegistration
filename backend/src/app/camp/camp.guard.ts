import type { Request } from 'express';
import { campManager } from '#app/campManager/camp-manager.guard';
import { type GuardFn, and, campPublic, or } from '#core/guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { CampService } from '#app/camp/camp.service';
import { resolve } from '#core/ioc/container';

export const campFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.campId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  // Load models for guard
  const campService = resolve(CampService);
  const camp = await campService.getCampById(file.campId);
  req.setModelOrFail('camp', camp);

  const fileAccess: GuardFn = () => {
    return file.accessLevel === 'public';
  };

  return or(campManager('camp.files.view'), and(fileAccess, campPublic));
};
