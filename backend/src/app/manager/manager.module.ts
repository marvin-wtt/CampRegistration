import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import managerRoutes from '#app/manager/manager.routes';
import { registerRouteModelBinding } from '#core/router';
import managerService from '#app/manager/manager.service';
import type { ManagerPermission } from '@camp-registration/common/permissions';

export class ManagerModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('manager', (req, id) => {
      const camp = req.modelOrFail('camp');
      return managerService.getManagerById(camp.id, id);
    });

    router.use('/camps/:campId/managers', managerRoutes);
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
