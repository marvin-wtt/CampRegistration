import type { Request } from 'express';
import {
  and,
  campActive,
  campManager,
  type GuardFn,
  or,
} from '#guards/index.js';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import messageService from '#app/message/message.service.js';
import campService from '#app/camp/camp.service.js';

export const messageFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.messageId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  // Load models for guard
  const message = await messageService.getMessageWithCampById(file.messageId);
  if (!message || !message.registration) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Message related to file not found',
    );
  }
  const camp = await campService.getCampById(message.registration.camp.id);

  req.setModelOrFail('camp', camp);

  const fileAccess: GuardFn = () => {
    return file.accessLevel === 'public';
  };

  return or(campManager('camp.files.view'), and(fileAccess, campActive));
};
