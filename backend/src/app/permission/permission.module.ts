import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { PermissionController } from '#app/permission/permission.controller';
import { PermissionRouter } from '#app/permission/permission.routes';

export class PermissionModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(PermissionController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/permissions', new PermissionRouter());
  }
}
