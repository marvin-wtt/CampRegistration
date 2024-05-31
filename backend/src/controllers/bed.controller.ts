import { catchRequestAsync } from 'utils/catchAsync';
import { resource } from 'resources/resource';
import { bedService, registrationService } from 'services';
import { bedResource } from 'resources';
import httpStatus from 'http-status';
import { Registration } from '@prisma/client';
import ApiError from '../utils/ApiError';

const store = catchRequestAsync(async (req, res) => {
  const { roomId, campId } = req.params;
  const { registrationId } = req.body;

  // Validate registrationId is present
  if (registrationId !== undefined) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.createBed(roomId, registrationId);

  res.status(httpStatus.CREATED).json(resource(bedResource(bed)));
});

const update = catchRequestAsync(async (req, res) => {
  const { bedId, campId } = req.params;
  const { registrationId } = req.body;

  // Validate registrationId is present
  if (registrationId !== null) {
    await getRegistrationOrFail(campId, registrationId);
  }

  const bed = await bedService.updateBedById(bedId, registrationId);

  res.json(resource(bedResource(bed)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { bedId } = req.params;
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
