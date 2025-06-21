import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { ManagerRouter } from '#app/manager/manager.routes';
import type { ManagerPermission } from '@camp-registration/common/permissions';

export class ManagerModule implements AppModule {
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
