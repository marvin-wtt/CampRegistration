import { auth, guard } from '#middlewares/index';
import { hasEventPermission } from '#app/event/event.guard';
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
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return this.roomService.getRoomById(event.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.rooms.view')),
      controller(this.roomController, 'index'),
    );
    this.router.post(
      '/',
      auth(),
      guard(hasEventPermission('event.rooms.create')),
      controller(this.roomController, 'store'),
    );
    this.router.patch(
      '/',
      auth(),
      guard(hasEventPermission('event.rooms.edit')),
      controller(this.roomController, 'bulkUpdate'),
    );
    this.router.get(
      '/:roomId',
      auth(),
      guard(hasEventPermission('event.rooms.view')),
      controller(this.roomController, 'show'),
    );
    this.router.patch(
      '/:roomId',
      auth(),
      guard(hasEventPermission('event.rooms.edit')),
      controller(this.roomController, 'update'),
    );
    this.router.delete(
      '/:roomId',
      auth(),
      guard(hasEventPermission('event.rooms.delete')),
      controller(this.roomController, 'destroy'),
    );
  }
}
