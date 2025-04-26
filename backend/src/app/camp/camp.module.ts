import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import campRoutes from '#app/camp/camp.routes';
import { registerRouteModelBinding } from '#core/router';
import campService from '#app/camp/camp.service';
import type {
  CampPermission,
  FilePermission,
} from '@camp-registration/common/permissions';

export class CampModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('camp', (_req, id) =>
      campService.getCampById(id),
    );

    router.use('/camps', campRoutes);
  }

  registerPermissions(): RoleToPermissions<CampPermission | FilePermission> {
    return {
      DIRECTOR: [
        'camp.edit',
        'camp.delete',

        'camp.files.view',
        'camp.files.create',
        'camp.files.edit',
        'camp.files.delete',
      ],
      COUNSELOR: ['camp.files.view'],
      VIEWER: ['camp.files.view'],
    };
  }
}
