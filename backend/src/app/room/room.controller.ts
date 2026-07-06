import httpStatus from 'http-status';
import { RoomService } from './room.service.js';
import { RoomResource } from './room.resource.js';
import validator from './room.validation.js';
import { type Request, type Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject, injectable } from 'inversify';

@injectable()
export class RoomController extends BaseController {
  constructor(
    @inject(RoomService) private readonly roomService: RoomService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
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

    await this.realtimeService.emit(
      campId,
      'room',
      room.id,
      'created',
      req.clientId(),
    );

    res.status(httpStatus.CREATED).resource(new RoomResource(room));
  }

  async update(req: Request, res: Response) {
    const {
      params: { campId, roomId },
      body: { name, sortOrder },
    } = await req.validate(validator.update);

    const room = await this.roomService.updateRoomById(roomId, name, sortOrder);

    await this.realtimeService.emit(
      campId,
      'room',
      room.id,
      'updated',
      req.clientId(),
    );

    res.resource(new RoomResource(room));
  }

  async bulkUpdate(req: Request, res: Response) {
    const {
      params: { campId },
      body: { rooms },
    } = await req.validate(validator.bulkUpdate);

    const updatedRooms = await this.roomService.bulkUpdateRooms(campId, rooms);

    // One collection-level event for the whole transaction — per-room events
    // would make every subscriber refetch each room individually.
    await this.realtimeService.emitInvalidation(campId, 'room', req.clientId());

    res.resource(RoomResource.collection(updatedRooms));
  }

  async destroy(req: Request, res: Response) {
    const {
      params: { campId, roomId },
    } = await req.validate(validator.destroy);

    await this.roomService.deleteRoomById(roomId);

    await this.realtimeService.emit(
      campId,
      'room',
      roomId,
      'deleted',
      req.clientId(),
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
