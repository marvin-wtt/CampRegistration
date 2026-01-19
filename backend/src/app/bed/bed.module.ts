import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
} from '#core/base/AppModule';
import { BedRouter } from '#app/bed/bed.routes';
import type { BedPermission } from '@camp-registration/common/permissions';
import { BedService } from '#app/bed/bed.service';
import { BedController } from '#app/bed/bed.controller';

export class BedModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(BedService).toSelf().inSingletonScope();
    options.bind(BedController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/rooms/:roomId/beds', new BedRouter());
  }

  registerPermissions(): RoleToPermissions<BedPermission> {
    return {
      DIRECTOR: [
        'camp.rooms.beds.create',
        'camp.rooms.beds.edit',
        'camp.rooms.beds.delete',
      ],
      COORDINATOR: [
        'camp.rooms.beds.create',
        'camp.rooms.beds.edit',
        'camp.rooms.beds.delete',
      ],
      COUNSELOR: ['camp.rooms.beds.edit'],
      VIEWER: [],
    };
  }
}
