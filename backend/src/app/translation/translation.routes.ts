import { auth } from '#middlewares/auth.middleware';
import { TranslationController } from '#app/translation/translation.controller';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class TranslationRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for translation routes
  }

  protected defineRoutes() {
    const translationController = resolve(TranslationController);

    this.router.use(auth());

    this.router.get('/status', controller(translationController, 'status'));
    this.router.post('/', controller(translationController, 'translate'));
  }
}
