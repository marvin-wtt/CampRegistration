import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { TotpRouter } from '#app/totp/totp.routes';
import { TotPController } from '#app/totp/totp.controller';
import { TotpService } from '#app/totp/totp.service';

export class TotpModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TotpService).toSelf().inSingletonScope();
    options.bind(TotPController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/totp', new TotpRouter());
  }
}
