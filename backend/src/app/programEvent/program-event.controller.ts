import { catchRequestAsync } from 'utils/catchAsync';
import httpStatus from 'http-status';
import { collection, resource } from 'app/resource';
import programEventService from './program-event.service';
import programEventResource from './program-event.resource';
import { routeModel } from 'utils/verifyModel';

const show = catchRequestAsync(async (req, res) => {
  const event = routeModel(req.models.programEvent);

  res.json(resource(programEventResource(event)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;

  const events = await programEventService.queryProgramEvent(campId);
  const resources = events.map((value) => programEventResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;

  const event = await programEventService.createProgramEvent(campId, {
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
  const { programEventId: id } = req.params;
  const data = req.body;

  const event = await programEventService.updateProgramEventById(id, {
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
  const { programEventId: id } = req.params;

  await programEventService.deleteProgramEventById(id);

  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
