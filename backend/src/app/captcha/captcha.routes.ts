import { CaptchaController } from './captcha.controller.js';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { resolve } from '#core/ioc/container';

export class CaptchaRouter extends ModuleRouter {
  protected registerBindings() {
    // No model bindings needed for captcha routes
  }

  protected defineRoutes() {
    const captchaController = resolve(CaptchaController);

    this.router.get('/', controller(captchaController, 'config'));
  }
}
