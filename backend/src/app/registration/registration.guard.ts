import type { Request } from 'express';
import { campManager, type GuardFn } from '#guards/index';
import ApiError from '#utils/ApiError.js';
import httpStatus from 'http-status';
import registrationService from '#app/registration/registration.service';
import campService from '#app/camp/camp.service';

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
  const camp = await campService.getCampById(registration.camp.id);

  req.setModelOrFail('registration', registration);
  req.setModelOrFail('camp', camp);

  return campManager('camp.registrations.view');
};
