import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { hasEventPermission } from '#app/event/event.guard';
import { BedController } from './bed.controller.js';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { BedService } from '#app/bed/bed.service';
import { controller } from '#core/router/bindController';
import { resolve } from '#core/ioc/container';

export class BedRouter extends ModuleRouter {
  protected registerBindings() {
    const bedService = resolve(BedService);
    this.bindModel('bed', (req, id) => {
      const room = req.model('room');
      if (!room) {
        return null;
      }
      return bedService.getBedById(id, room.id);
    });
  }

  protected defineRoutes() {
    const bedController = resolve(BedController);

    this.router.post(
      '/',
      auth(),
      guard(hasEventPermission('event.rooms.beds.create')),
      controller(bedController, 'store'),
    );
    this.router.patch(
      '/:bedId',
      auth(),
      guard(hasEventPermission('event.rooms.beds.edit')),
      controller(bedController, 'update'),
    );
    this.router.delete(
      '/:bedId',
      auth(),
      guard(hasEventPermission('event.rooms.beds.delete')),
      controller(bedController, 'destroy'),
    );
  }
}
