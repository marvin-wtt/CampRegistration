import type { Request } from 'express';
import { campManager, type GuardFn } from '#guards/index';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import registrationService from '#app/registration/registration.service';
import { CampService } from '#app/camp/camp.service';
import { resolve } from '#core/ioc/container';

export const registrationFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  if (!file.registrationId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid guard handler',
    );
  }

  const registration = await registrationService.getRegistrationWithCampById(
    file.registrationId,
  );
  if (!registration) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Registration related to file not found',
    );
  }

  const campService = resolve(CampService);
  const camp = await campService.getCampById(registration.camp.id);

  req.setModelOrFail('registration', registration);
  req.setModelOrFail('camp', camp);

  return campManager('camp.registrations.view');
};
