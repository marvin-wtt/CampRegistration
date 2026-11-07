import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { AdminController } from './admin.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class AdminRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for admin routes
  }

  protected defineRoutes() {
    const adminController = resolve(AdminController);

    this.router.get(
      '/overview',
      auth(),
      guard(),
      controller(adminController, 'overview'),
    );
  }
}
