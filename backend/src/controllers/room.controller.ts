import { catchRequestAsync } from "utils/catchAsync";
import httpStatus from "http-status";
import { collection, resource } from "resources/resource";
import { roomService } from "services";
import { roomResource } from "resources";
import { routeModel } from "utils/verifyModel";

const show = catchRequestAsync(async (req, res) => {
  const room = routeModel(req.models.room);

  res.json(resource(roomResource(room)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const rooms = await roomService.queryRooms(campId);
  const resources = rooms.map((value) => roomResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;
  const room = await roomService.createRoom(campId, data.name, data.capacity);
  res.status(httpStatus.CREATED).json(resource(roomResource(room)));
});

const update = catchRequestAsync(async (req, res) => {
  const { roomId } = req.params;
  const data = req.body;
  const room = await roomService.updateRoomById(roomId, {
    capacity: data.capacity,
    name: data.capacity,
  });
  res.json(resource(roomResource(room)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { roomId } = req.params;
  await roomService.deleteRoomById(roomId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
