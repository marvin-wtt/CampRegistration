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
import { registerFileGuard } from '#app/file/file.guard';
import { and, campActive, campManager, or, type GuardFn } from '#guards/index';
import type { Request } from 'express';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';

export class CampModule implements AppModule {
  configure(): Promise<void> | void {
    registerFileGuard('camp', this.campFileGuard);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps', new CampRouter());
  }

  private campFileGuard = async (req: Request): Promise<GuardFn> => {
    const file = req.modelOrFail('file');

    if (!file.campId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invalid file guard handler');
    }

    // Load models for guard
    const camp = await campService.getCampById(file.campId);
    req.setModelOrFail('camp', camp);

    const fileAccess: GuardFn = () => {
      return file.accessLevel === 'public';
    };

    return or(campManager('camp.files.view'), and(fileAccess, campActive));
  };

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
