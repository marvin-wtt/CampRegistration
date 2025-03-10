import { resource } from '#core/resource';
import bedService from './bed.service.js';
import bedResource from './bed.resource.js';
import registrationService from '#app/registration/registration.service';
import httpStatus from 'http-status';
import { Registration } from '@prisma/client';
import ApiError from '#utils/ApiError';
import validator from './bed.validation.js';
import type { Request, Response } from 'express';

const store = async (req: Request, res: Response) => {
  const {
    params: { campId, roomId },
    body: { registrationId },
  } = await req.validate(validator.store);

  // Validate registrationId is present
  if (registrationId !== undefined) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.createBed(roomId, registrationId);

  res.status(httpStatus.CREATED).json(resource(bedResource(bed)));
};

const update = async (req: Request, res: Response) => {
  const {
    params: { campId, bedId },
    body: { registrationId },
  } = await req.validate(validator.update);

  // Validate registrationId is present
  if (registrationId !== null) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.updateBedById(bedId, registrationId);

  res.json(resource(bedResource(bed)));
};

const destroy = async (req: Request, res: Response) => {
  const {
    params: { bedId },
  } = await req.validate(validator.destroy);

  await bedService.deleteBedById(bedId);

  res.sendStatus(httpStatus.NO_CONTENT);
};

const getRegistrationOrFail = async (
  campId: string,
  registrationId: string,
): Promise<Registration> => {
  const registration = await registrationService.getRegistrationById(
    campId,
    registrationId,
  );

  if (registration === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid registration id');
  }

  return registration;
};

export default {
  store,
  update,
  destroy,
};
