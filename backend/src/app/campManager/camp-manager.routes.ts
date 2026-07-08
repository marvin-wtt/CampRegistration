import { auth, guard } from '#middlewares/index';
import {
  campManager,
  campManagerSelf,
} from '#app/campManager/camp-manager.guard';
import { CampManagerController } from './camp-manager.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { CampManagerService } from '#app/campManager/camp-manager.service.js';
import { resolve } from '#core/ioc/container';
import { or } from '#core/guard';

export class CampManagerRouter extends ModuleRouter {
  protected registerBindings() {
    const managerService = resolve(CampManagerService);
    this.bindModel('campManager', (req, id) => {
      const camp = req.model('camp');
      if (!camp) {
        return null;
      }
      return managerService.getManagerById(camp.id, id);
    });
  }

  protected defineRoutes() {
    const managerController = resolve(CampManagerController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.managers.view')),
      controller(managerController, 'index'),
    );
    this.router.get(
      '/:campManagerId',
      guard(campManager('camp.managers.view')),
      controller(managerController, 'show'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.managers.create')),
      controller(managerController, 'store'),
    );
    this.router.patch(
      '/:campManagerId',
      guard(campManager('camp.managers.edit')),
      controller(managerController, 'update'),
    );
    this.router.delete(
      '/:campManagerId',
      guard(or(campManager('camp.managers.delete'), campManagerSelf)),
      controller(managerController, 'destroy'),
    );
  }
}
