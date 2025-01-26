import httpStatus from 'http-status';
import { collection, resource } from '#core/resource';
import roomService from './room.service.js';
import roomResource from './room.resource.js';
import { routeModel } from '#utils/verifyModel';
import { validateRequest } from '#core/validation/request';
import validator from './room.validation.js';
import { type Request, type Response } from 'express';

const show = async (req: Request, res: Response) => {
  const room = routeModel(req.models.room);

  res.json(resource(roomResource(room)));
};

const index = async (req: Request, res: Response) => {
  const {
    params: { campId },
  } = await validateRequest(req, validator.index);

  const rooms = await roomService.queryRooms(campId);
  const resources = rooms.map((value) => roomResource(value));

  res.json(collection(resources));
};

const store = async (req: Request, res: Response) => {
  const {
    params: { campId },
    body: { name, capacity },
  } = await validateRequest(req, validator.store);

  const room = await roomService.createRoom(campId, name, capacity);

  res.status(httpStatus.CREATED).json(resource(roomResource(room)));
};

const update = async (req: Request, res: Response) => {
  const {
    params: { roomId },
    body: { name },
  } = await validateRequest(req, validator.update);

  const room = await roomService.updateRoomById(roomId, name);

  res.json(resource(roomResource(room)));
};

const destroy = async (req: Request, res: Response) => {
  const {
    params: { roomId },
  } = await validateRequest(req, validator.destroy);

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
