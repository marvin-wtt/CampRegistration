import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { TranslationController } from '#app/translation/translation.controller';
import { TranslationService } from '#app/translation/translation.service';
import { TranslationRouter } from '#app/translation/translation.routes';

export class TranslationModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TranslationService).toSelf().inSingletonScope();
    options.bind(TranslationController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/translation', new TranslationRouter());
  }
}
