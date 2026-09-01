import { auth, guard } from '#middlewares/index';
import { LegalController } from './legal.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class LegalRouter extends ModuleRouter {
  protected registerBindings() {
    // No model binding: `:type` is a fixed enum, not an entity to resolve.
  }

  protected defineRoutes() {
    const legalController = resolve(LegalController);

    this.router.get('/', controller(legalController, 'index'));
    this.router.get('/:type', controller(legalController, 'show'));
    this.router.patch(
      '/:type',
      auth(),
      guard(),
      controller(legalController, 'update'),
    );
  }
}
