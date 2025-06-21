import type { Request } from 'express';
import {
  type GuardFn,
  and,
  campActive,
  campManager,
  or,
} from '#guards/index.js';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import campService from '#app/camp/camp.service.js';

export const campFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.campId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid file guard handler');
  }

  // Load models for guard
  const camp = await campService.getCampById(file.campId);
  req.setModelOrFail('camp', camp);

  const fileAccess: GuardFn = () => {
    return file.accessLevel === 'public';
  };

  return or(campManager('camp.files.view'), and(fileAccess, campActive));
};
