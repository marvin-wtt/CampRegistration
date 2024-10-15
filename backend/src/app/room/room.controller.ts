import httpStatus from 'http-status';
import { collection, resource } from 'app/resource';
import roomService from './room.service';
import roomResource from './room.resource';
import { routeModel } from 'utils/verifyModel';
import { Request, Response } from 'express';

const show = async (req: Request, res: Response) => {
  const room = routeModel(req.models.room);

  res.json(resource(roomResource(room)));
};

const index = async (req: Request, res: Response) => {
  const { campId } = req.params;
  const rooms = await roomService.queryRooms(campId);
  const resources = rooms.map((value) => roomResource(value));

  res.json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const { campId } = req.params;
  const { name, capacity } = req.body;
  const room = await roomService.createRoom(campId, name, capacity);
  res.status(httpStatus.CREATED).json(resource(roomResource(room)));
};

const update = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { name } = req.body;

  const room = await roomService.updateRoomById(roomId, name);
  res.json(resource(roomResource(room)));
};

const destroy = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  await roomService.deleteRoomById(roomId);
  res.status(httpStatus.NO_CONTENT).send();
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};
