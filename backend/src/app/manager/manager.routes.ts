import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/manager.guard';
import managerController from './manager.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import managerService from '#app/manager/manager.service';

export class ManagerRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('manager', (req, id) => {
      const camp = req.modelOrFail('camp');
      return managerService.getManagerById(camp.id, id);
    });
  }

  protected defineRoutes() {
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
