import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { SetupRouter } from '#app/setup/setup.routes';
import { SetupController } from '#app/setup/setup.controller';
import { SetupService } from '#app/setup/setup.service';

export class SetupModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(SetupService).toSelf().inSingletonScope();
    options.bind(SetupController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/setup', new SetupRouter());
  }
}
