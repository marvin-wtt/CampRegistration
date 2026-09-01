import type { Request } from 'express';
import { hasEventPermission } from '#app/event/event.guard';
import { type GuardFn } from '#core/guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { EventService } from '#app/event/event.service';
import { resolve } from '#core/ioc/container';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';

export const messageDeliveryFileGuard = async (
  req: Request,
): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.messageDeliveryId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid file guard handler',
    );
  }

  // Load models for guard
  const messageService = resolve(MessageDeliveryService);
  const delivery = await messageService.getDeliveryWithEventById(
    file.messageDeliveryId,
  );
  if (!delivery) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Message delivery related to file not found',
    );
  }

  const eventService = resolve(EventService);
  const event = await eventService.getEventById(delivery.registration.eventId);
  req.setModelOrFail('event', event);

  return hasEventPermission('event.messages.view');
};
