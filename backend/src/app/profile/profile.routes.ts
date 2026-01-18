import { auth } from '#middlewares/auth.middleware';
import { ProfileController } from '#app/profile/profile.controller';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class ProfileRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for profile routes
  }

  protected defineRoutes() {
    const profileController = resolve(ProfileController);

    this.router.use(auth());

    this.router.get('/', controller(profileController, 'show'));
    this.router.patch('/', controller(profileController, 'update'));
    this.router.delete('/', controller(profileController, 'destroy'));
  }
}
