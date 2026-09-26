import type { Request } from 'express';
import { hasEventPermission } from '#app/event/event.guard';
import { type GuardFn } from '#core/guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { EventService } from '#app/event/event.service';
import { MessageTemplateService } from '#app/messageTemplate/message-template.service';
import { resolve } from '#core/ioc/container';

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
  const messageTemplateService = resolve(MessageTemplateService);
  const messageTemplate =
    await messageTemplateService.getMessageTemplateWithEvent(
      file.messageTemplateId,
    );
  if (!messageTemplate) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Message template related to file not found',
    );
  }

  const eventService = resolve(EventService);
  const event = await eventService.getEventById(messageTemplate.event.id);
  req.setModelOrFail('event', event);

  return hasEventPermission('event.message_templates.view');
};
