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
    const camp = req.modelOrFail('camp');
    await req.validate(validator.index);

    const rooms = await this.roomService.queryRooms(camp.id);

    res.resource(RoomResource.collection(rooms));
  }

  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: { name, capacity },
    } = await req.validate(validator.store);

    const room = await this.roomService.createRoom(camp.id, name, capacity);

    void this.realtimeService.emit(camp.id, 'room', room.id, 'created');

    res.status(httpStatus.CREATED).resource(new RoomResource(room));
  }

  async update(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const room = req.modelOrFail('room');
    const {
      body: { name, sortOrder },
    } = await req.validate(validator.update);

    const updatedRoom = await this.roomService.updateRoomById(
      room.id,
      name,
      sortOrder,
    );

    void this.realtimeService.emit(camp.id, 'room', updatedRoom.id, 'updated');

    res.resource(new RoomResource(updatedRoom));
  }

  async bulkUpdate(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: { rooms },
    } = await req.validate(validator.bulkUpdate);

    const updatedRooms = await this.roomService.bulkUpdateRooms(camp.id, rooms);

    // One collection-level event for the whole transaction — per-room events
    // would make every subscriber refetch each room individually.
    void this.realtimeService.emitInvalidation(camp.id, 'room');

    res.resource(RoomResource.collection(updatedRooms));
  }

  async destroy(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const room = req.modelOrFail('room');
    await req.validate(validator.destroy);

    await this.roomService.deleteRoomById(room.id);

    void this.realtimeService.emit(camp.id, 'room', room.id, 'deleted');

    res.status(httpStatus.NO_CONTENT).send();
  }
}
