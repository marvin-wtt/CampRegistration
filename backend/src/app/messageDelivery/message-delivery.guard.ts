import type { Request } from 'express';
import { campManager } from '#app/campManager/camp-manager.guard';
import { type GuardFn } from '#core/guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { CampService } from '#app/camp/camp.service';
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
  const delivery = await messageService.getDeliveryWithCampById(
    file.messageDeliveryId,
  );
  if (!delivery?.registration) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Message delivery related to file not found',
    );
  }

  const campService = resolve(CampService);
  const camp = await campService.getCampById(delivery.registration.campId);
  req.setModelOrFail('camp', camp);

  return campManager('camp.messages.view');
};
