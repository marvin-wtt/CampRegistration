import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { CaptchaService } from './captcha.service.js';

export class CaptchaModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(CaptchaService).toSelf().inSingletonScope();
  }
}
