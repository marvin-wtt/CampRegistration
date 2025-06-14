import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import totpRoutes from '#app/totp/totp.routes';

export class TotpModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/totp', totpRoutes);
  }
}
