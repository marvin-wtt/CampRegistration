import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import { ManagerController } from './manager.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import managerService from '#app/manager/manager.service';
import { resolve } from '#core/ioc/container';

export class ManagerRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('manager', (req, id) => {
      const camp = req.modelOrFail('camp');
      return managerService.getManagerById(camp.id, id);
    });
  }

  protected defineRoutes() {
    const managerController = resolve(ManagerController);

    this.router.use(auth());

    this.router.get(
      '/',
      guard(campManager('camp.managers.view')),
      controller(managerController, 'index'),
    );
    this.router.post(
      '/',
      guard(campManager('camp.managers.create')),
      controller(managerController, 'store'),
    );
    this.router.patch(
      '/:managerId',
      guard(campManager('camp.managers.edit')),
      controller(managerController, 'update'),
    );
    this.router.delete(
      '/:managerId',
      guard(campManager('camp.managers.delete')),
      controller(managerController, 'destroy'),
    );
  }
}
