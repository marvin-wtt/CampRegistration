import type { Request } from 'express';
import { campManager, type GuardFn } from '#guards/index';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import messageService from '#app/message/message.service';
import { CampService } from '#app/camp/camp.service';
import { resolve } from '#core/ioc/container.js';

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

  const campService = resolve(CampService);
  const camp = await campService.getCampById(message.registration.camp.id);
  req.setModelOrFail('camp', camp);

  return campManager('camp.messages.view');
};
