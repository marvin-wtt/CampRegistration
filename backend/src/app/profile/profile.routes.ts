import { auth } from '#middlewares/auth.middleware';
import profileController from './profile.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';

export class ProfileRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for profile routes
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get('/', controller(profileController, 'show'));
    this.router.patch('/', controller(profileController, 'update'));
    this.router.delete('/', controller(profileController, 'destroy'));
  }
}
