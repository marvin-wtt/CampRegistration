import type { Request } from 'express';
import { campManager } from '#app/campManager/camp-manager.guard';
import { type GuardFn, or } from '#core/guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { CampService } from '#app/camp/camp.service';
import { resolve } from '#core/ioc/container';

async function prepareRequestModels(req: Request) {
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
}

export const campFileViewGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);
  const file = req.modelOrFail('file');

  const fileAccess: GuardFn = () => {
    return file.accessLevel === 'public';
  };

  return or(campManager('camp.files.view'), fileAccess);
};

export const campFileEditGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);

  return campManager('camp.files.edit');
};

export const campFileDeleteGuard = async (req: Request): Promise<GuardFn> => {
  await prepareRequestModels(req);

  return campManager('camp.files.delete');
};

export const campFileGuards = {
  view: campFileViewGuard,
  edit: campFileEditGuard,
  delete: campFileDeleteGuard,
};
