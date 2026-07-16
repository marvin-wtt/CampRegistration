import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { AdminController } from '#app/admin/admin.controller';
import { AdminRouter } from '#app/admin/admin.routes';

export class AdminModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(AdminController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/admin', new AdminRouter());
  }
}
