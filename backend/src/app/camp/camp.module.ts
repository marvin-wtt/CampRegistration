import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import type { ScopeResolvers } from '#core/permission.guard';
import { CampRouter } from '#app/camp/camp.routes';
import { registerFileGuard } from '#app/file/file.guard';
import { campFileGuards, campScopeResolver } from '#app/camp/camp.guard';
import { CampFilesRouter } from '#app/camp/camp-files.routes';
import { CampService } from '#app/camp/camp.service';
import { CampController } from '#app/camp/camp.controller';

export class CampModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(CampService).toSelf().inSingletonScope();
    options.bind(CampController).toSelf().inSingletonScope();
  }

  registerScopeResolvers(): ScopeResolvers {
    return { camp: campScopeResolver };
  }

  registerRoutes(router: AppRouter): void {
    registerFileGuard('camp', campFileGuards);

    router.useRouter('/camps/:campId/files', new CampFilesRouter());
    router.useRouter('/camps', new CampRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      camp: {
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
      },
    };
  }
}
