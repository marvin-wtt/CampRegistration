import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import type {
  CampPermission,
  FilePermission,
} from '@camp-registration/common/permissions';
import CampRouter from '#app/camp/camp.routes';

export class CampModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.use('/camps', new CampRouter().router);
  }

  registerPermissions(): RoleToPermissions<CampPermission | FilePermission> {
    return {
      DIRECTOR: [
        'camp.view',
        'camp.edit',
        'camp.delete',

        'camp.files.view',
        'camp.files.create',
        'camp.files.edit',
        'camp.files.delete',
      ],
      COORDINATOR: [
        'camp.view',
        'camp.edit',

        'camp.files.view',
        'camp.files.create',
        'camp.files.edit',
        'camp.files.delete',
      ],
      COUNSELOR: ['camp.view', 'camp.files.view'],
      VIEWER: ['camp.view', 'camp.files.view'],
    };
  }
}
