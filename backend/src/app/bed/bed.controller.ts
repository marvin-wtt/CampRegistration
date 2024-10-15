import { resource } from 'app/resource';
import bedService from './bed.service';
import bedResource from './bed.resource';
import registrationService from 'app/registration/registration.service';
import httpStatus from 'http-status';
import { Registration } from '@prisma/client';
import ApiError from 'utils/ApiError';
import { Request, Response } from 'express';

const store = async (req: Request, res: Response) => {
  const { roomId, campId } = req.params;
  const { registrationId } = req.body;

  // Validate registrationId is present
  if (registrationId !== undefined) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.createBed(roomId, registrationId);

  res.status(httpStatus.CREATED).json(resource(bedResource(bed)));
};

const update = async (req: Request, res: Response) => {
  const { bedId, campId } = req.params;
  const { registrationId } = req.body;

  // Validate registrationId is present
  if (registrationId !== null) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.updateBedById(bedId, registrationId);

  res.json(resource(bedResource(bed)));
};

const destroy = async (req: Request, res: Response) => {
  const { bedId } = req.params;
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
