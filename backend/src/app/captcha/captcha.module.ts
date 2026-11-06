import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { CaptchaController } from './captcha.controller.js';
import { CaptchaRouter } from './captcha.routes.js';

// Serves the public captcha settings; the mechanism lives in #core/captcha.
export class CaptchaModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(CaptchaController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/captcha', new CaptchaRouter());
  }
}
