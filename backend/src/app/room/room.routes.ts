import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import roomController from './room.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import roomService from '#app/room/room.service';

export class RoomRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('room', (req, id) => {
      const camp = req.modelOrFail('camp');
      return roomService.getRoomById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      auth(),
      guard(campManager('camp.rooms.view')),
      controller(roomController, 'index'),
    );
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.rooms.create')),
      controller(roomController, 'store'),
    );
    this.router.get(
      '/:roomId',
      auth(),
      guard(campManager('camp.rooms.view')),
      controller(roomController, 'show'),
    );
    this.router.patch(
      '/:roomId',
      auth(),
      guard(campManager('camp.rooms.edit')),
      controller(roomController, 'update'),
    );
    this.router.delete(
      '/:roomId',
      auth(),
      guard(campManager('camp.rooms.delete')),
      controller(roomController, 'destroy'),
    );
  }
}
