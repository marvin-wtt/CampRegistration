import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { LegalService } from '#app/legal/legal.service';
import { LegalController } from '#app/legal/legal.controller';
import { LegalRouter } from '#app/legal/legal.routes';

export class LegalModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(LegalService).toSelf().inSingletonScope();
    options.bind(LegalController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/legal', new LegalRouter());
  }
}
