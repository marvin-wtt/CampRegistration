import { catchRequestAsync } from 'utils/catchAsync';
import { resource } from 'core/resource';
import bedService from './bed.service';
import bedResource from './bed.resource';
import registrationService from 'app/registration/registration.service';
import httpStatus from 'http-status';
import { Registration } from '@prisma/client';
import ApiError from 'utils/ApiError';
import { validateRequest } from 'core/validation/request';
import validator from './bed.validation';

const store = catchRequestAsync(async (req, res) => {
  const {
    params: { campId, roomId },
    body: { registrationId },
  } = await validateRequest(req, validator.store);

  // Validate registrationId is present
  if (registrationId !== undefined) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.createBed(roomId, registrationId);

  res.status(httpStatus.CREATED).json(resource(bedResource(bed)));
});

const update = catchRequestAsync(async (req, res) => {
  const {
    params: { campId, bedId },
    body: { registrationId },
  } = await validateRequest(req, validator.update);

  // Validate registrationId is present
  if (registrationId !== null) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.updateBedById(bedId, registrationId);

  res.json(resource(bedResource(bed)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const {
    params: { bedId },
  } = await validateRequest(req, validator.destroy);

  await bedService.deleteBedById(bedId);

  res.sendStatus(httpStatus.NO_CONTENT);
});

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
