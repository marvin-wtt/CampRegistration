import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
} from '#core/base/AppModule';
import { ManagerRouter } from '#app/manager/manager.routes';
import type { ManagerPermission } from '@camp-registration/common/permissions';
import { ManagerController } from '#app/manager/manager.controller';

export class ManagerModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ManagerController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/managers', new ManagerRouter());
  }

  registerPermissions(): RoleToPermissions<ManagerPermission> {
    return {
      DIRECTOR: [
        'camp.managers.view',
        'camp.managers.create',
        'camp.managers.edit',
        'camp.managers.delete',
      ],
      COORDINATOR: ['camp.managers.view'],
      COUNSELOR: ['camp.managers.view'],
      VIEWER: [],
    };
  }
}
