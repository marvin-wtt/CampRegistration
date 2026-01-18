import httpStatus from 'http-status';
import { RoomService } from './room.service.js';
import { RoomResource } from './room.resource.js';
import validator from './room.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { inject, injectable } from 'inversify';

@injectable()
export class RoomController extends BaseController {
  constructor(@inject(RoomService) private readonly roomService: RoomService) {
    super();
  }

  show(req: Request, res: Response) {
    const room = req.modelOrFail('room');

    res.resource(new RoomResource(room));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const rooms = await this.roomService.queryRooms(campId);

    res.resource(RoomResource.collection(rooms));
  }

  async store(req: Request, res: Response) {
    const {
      params: { campId },
      body: { name, capacity },
    } = await req.validate(validator.store);

    const room = await this.roomService.createRoom(campId, name, capacity);

    res.status(httpStatus.CREATED).resource(new RoomResource(room));
  }

  async update(req: Request, res: Response) {
    const {
      params: { roomId },
      body: { name, sortOrder },
    } = await req.validate(validator.update);

    const room = await this.roomService.updateRoomById(roomId, name, sortOrder);

    res.resource(new RoomResource(room));
  }

  async bulkUpdate(req: Request, res: Response) {
    const {
      params: { campId },
      body: { rooms },
    } = await req.validate(validator.bulkUpdate);

    const updatedRooms = await this.roomService.bulkUpdateRooms(campId, rooms);

    res.resource(RoomResource.collection(updatedRooms));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { roomId },
    } = await req.validate(validator.destroy);

    await this.roomService.deleteRoomById(roomId);

    res.status(httpStatus.NO_CONTENT).send();
  }
}
