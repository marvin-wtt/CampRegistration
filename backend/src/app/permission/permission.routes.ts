import { auth } from '#middlewares/index';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';
import { PermissionController } from './permission.controller.js';

export class PermissionRouter extends ModuleRouter {
  protected registerBindings() {
    // No model binding: the matrix is global, not scoped to an entity.
  }

  protected defineRoutes() {
    const permissionController = resolve(PermissionController);

    this.router.get('/', auth(), controller(permissionController, 'index'));
  }
}
