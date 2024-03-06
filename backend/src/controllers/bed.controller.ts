import { catchRequestAsync } from 'utils/catchAsync';
import { resource } from 'resources/resource';
import { bedService } from 'services';
import { bedResource } from 'resources';
import httpStatus from 'http-status';

const store = catchRequestAsync(async (req, res) => {
  const { roomId } = req.params;
  const bed = await bedService.createBed(roomId);

  res.status(httpStatus.CREATED).json(resource(bedResource(bed)));
});

const update = catchRequestAsync(async (req, res) => {
  const { bedId } = req.params;
  const { registrationId } = req.body;
  const bed = await bedService.updateBedById(bedId, registrationId);

  res.json(resource(bedResource(bed)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { bedId } = req.params;
  await bedService.deleteBedById(bedId);

  res.sendStatus(httpStatus.NO_CONTENT);
});

export default {
  store,
  update,
  destroy,
};
