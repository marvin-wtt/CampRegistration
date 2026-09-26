import type { Request } from 'express';
import { hasEventPermission } from '#app/event/event.guard';
import { type GuardFn } from '#core/guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { MessageService } from '#app/message/message.service';
import { EventService } from '#app/event/event.service';
import { resolve } from '#core/ioc/container';

export const messageFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.messageId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  // Load models for guard
  const messageService = resolve(MessageService);
  const message = await messageService.findMessageById(file.messageId);
  if (!message) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Message related to file not found',
    );
  }

  const eventService = resolve(EventService);
  const event = await eventService.getEventById(message.eventId);
  req.setModelOrFail('event', event);

  return hasEventPermission('event.messages.view');
};
