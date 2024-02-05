import { catchRequestAsync } from 'utils/catchAsync';
import httpStatus from 'http-status';
import { collection, resource } from 'resources/resource';
import { programPlannerService } from 'services';
import { programEventResource } from 'resources';
import { routeModel } from 'utils/verifyModel';

const show = catchRequestAsync(async (req, res) => {
  const room = routeModel(req.models.room);

  res.json(resource(programEventResource(room)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const events = await programPlannerService.queryProgramEvent(campId);
  const resources = events.map((value) => programEventResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;
  const event = await programPlannerService.createProgramEvent(campId, {
    title: data.title,
    details: data.details,
    location: data.location,
    date: data.date,
    time: data.time,
    duration: data.duration,
    color: data.color,
    side: data.side,
  });
  res.status(httpStatus.CREATED).json(resource(programEventResource(event)));
});

const update = catchRequestAsync(async (req, res) => {
  const { roomId } = req.params;
  const data = req.body;
  const event = await programPlannerService.updateProgramEventById(roomId, {
    title: data.title,
    details: data.details,
    location: data.location,
    date: data.date,
    time: data.time,
    duration: data.duration,
    color: data.color,
    side: data.side,
  });
  res.json(resource(programEventResource(event)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { roomId } = req.params;
  await programPlannerService.deleteProgramEventById(roomId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
