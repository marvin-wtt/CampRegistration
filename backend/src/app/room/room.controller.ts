import httpStatus from 'http-status';
import roomService from './room.service.js';
import { RoomResource } from './room.resource.js';
import validator from './room.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/BaseController.js';

class RoomController extends BaseController {
  show(req: Request, res: Response) {
    const room = req.modelOrFail('room');

    res.resource(new RoomResource(room));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const rooms = await roomService.queryRooms(campId);

    res.resource(RoomResource.collection(rooms));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body: { name, capacity },
    } = await req.validate(validator.store);

    const room = await roomService.createRoom(campId, name, capacity);

    res.status(httpStatus.CREATED).resource(new RoomResource(room));
  }

  async update(req: Request, res: Response) {
    const {
      params: { roomId },
      body: { name },
    } = await req.validate(validator.update);

    const room = await roomService.updateRoomById(roomId, name);

    res.resource(new RoomResource(room));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { roomId },
    } = await req.validate(validator.destroy);

    await roomService.deleteRoomById(roomId);

    res.status(httpStatus.NO_CONTENT).send();
  }
}

export default new RoomController();
