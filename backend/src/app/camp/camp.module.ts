import type {
  AppModule,
  AppRouter,
  BindOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import type {
  CampPermission,
  FilePermission,
} from '@camp-registration/common/permissions';
import { CampRouter } from '#app/camp/camp.routes';
import { registerFileGuard } from '#app/file/file.guard';
import { campFileGuard } from '#app/camp/camp.guard';
import { CampFilesRouter } from '#app/camp/camp-files.routes';
import { CampService } from '#app/camp/camp.service';
import { CampController } from '#app/camp/camp.controller';

export class CampModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(CampService).toSelf().inSingletonScope();
    options.bind(CampController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    registerFileGuard('camp', campFileGuard);

    router.useRouter('/camps/:campsId/files', new CampFilesRouter());
    router.useRouter('/camps', new CampRouter());
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
