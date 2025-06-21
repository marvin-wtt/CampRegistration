import type { AppModule, AppRouter } from '#core/base/AppModule';
import { TotpRouter } from '#app/totp/totp.routes';

export class TotpModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/totp', new TotpRouter());
  }
}
