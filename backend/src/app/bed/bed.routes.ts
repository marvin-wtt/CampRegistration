import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import bedController from './bed.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import bedService from '#app/bed/bed.service';
import { controller } from '#utils/bindController';

export class BedRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('bed', (req, id) => {
      const room = req.modelOrFail('room');
      return bedService.getBedById(id, room.id);
    });
  }

  protected defineRoutes() {
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.rooms.beds.create')),
      controller(bedController, 'store'),
    );
    this.router.patch(
      '/:bedId',
      auth(),
      guard(campManager('camp.rooms.beds.edit')),
      controller(bedController, 'update'),
    );
    this.router.delete(
      '/:bedId',
      auth(),
      guard(campManager('camp.rooms.beds.delete')),
      controller(bedController, 'destroy'),
    );
  }
}
