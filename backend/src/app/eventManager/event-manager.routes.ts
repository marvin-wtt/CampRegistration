import { auth, guard } from '#middlewares/index';
import { eventManagerSelf } from '#app/eventManager/event-manager.guard';
import { hasEventPermission } from '#app/event/event.guard';
import { EventManagerController } from './event-manager.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { EventManagerService } from '#app/eventManager/event-manager.service.js';
import { resolve } from '#core/ioc/container';
import { or } from '#core/guard';

export class EventManagerRouter extends ModuleRouter {
  protected registerBindings() {
    const managerService = resolve(EventManagerService);
    this.bindModel('eventManager', (req, id) => {
      const event = req.model('event');
      if (!event) {
        return null;
      }
      return managerService.getManagerById(event.id, id);
    });
  }

  protected defineRoutes() {
    const managerController = resolve(EventManagerController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.managers.view')),
      controller(managerController, 'index'),
    );
    this.router.get(
      '/:eventManagerId',
      guard(hasEventPermission('event.managers.view')),
      controller(managerController, 'show'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.managers.create')),
      controller(managerController, 'store'),
    );
    this.router.patch(
      '/:eventManagerId',
      guard(hasEventPermission('event.managers.edit')),
      controller(managerController, 'update'),
    );
    this.router.delete(
      '/:eventManagerId',
      guard(or(eventManagerSelf, hasEventPermission('event.managers.delete'))),
      controller(managerController, 'destroy'),
    );
  }
}
