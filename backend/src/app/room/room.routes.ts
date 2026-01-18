import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import { RoomController } from './room.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { RoomService } from '#app/room/room.service';
import { inject, injectable } from 'inversify';

@injectable()
export class RoomRouter extends ModuleRouter {
  constructor(
    @inject(RoomController) private readonly roomController: RoomController,
    @inject(RoomService) private readonly roomService: RoomService,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('room', (req, id) => {
      const camp = req.modelOrFail('camp');
      return this.roomService.getRoomById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.rooms.view')),
      controller(this.roomController, 'index'),
    );
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.rooms.create')),
      controller(this.roomController, 'store'),
    );
    this.router.patch(
      '/',
      auth(),
      guard(campManager('camp.rooms.edit')),
      controller(this.roomController, 'bulkUpdate'),
    );
    this.router.get(
      '/:roomId',
      auth(),
      guard(campManager('camp.rooms.view')),
      controller(this.roomController, 'show'),
    );
    this.router.patch(
      '/:roomId',
      auth(),
      guard(campManager('camp.rooms.edit')),
      controller(this.roomController, 'update'),
    );
    this.router.delete(
      '/:roomId',
      auth(),
      guard(campManager('camp.rooms.delete')),
      controller(this.roomController, 'destroy'),
    );
  }
}
