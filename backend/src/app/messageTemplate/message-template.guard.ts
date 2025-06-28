import type { Request } from 'express';
import { campManager, type GuardFn } from '#guards/index';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import campService from '#app/camp/camp.service';
import messageTemplateService from '#app/messageTemplate/message-template.service';

export const messageTemplateFileGuard = async (
  req: Request,
): Promise<GuardFn> => {
  const file = req.modelOrFail('file');
  if (!file.messageTemplateId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  // Load models for guard
  const messageTemplate =
    await messageTemplateService.getMessageTemplateWithCamp(
      file.messageTemplateId,
    );
  if (!messageTemplate) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Message template related to file not found',
    );
  }

  const camp = await campService.getCampById(messageTemplate.camp.id);
  req.setModelOrFail('camp', camp);

  return campManager('camp.message_templates.view');
};
