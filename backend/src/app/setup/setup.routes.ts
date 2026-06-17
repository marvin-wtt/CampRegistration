import { authLimiter } from '#middlewares';
import { SetupController } from '#app/setup/setup.controller';
import { setupAvailable } from '#app/setup/setup.guard';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class SetupRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for setup routes
  }

  protected defineRoutes() {
    const setupController = resolve(SetupController);

    this.router.use(authLimiter);

    this.router.get('/', controller(setupController, 'status'));
    this.router.post('/', setupAvailable, controller(setupController, 'setup'));
  }
}
