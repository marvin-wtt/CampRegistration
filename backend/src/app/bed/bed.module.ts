import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { BedRouter } from '#app/bed/bed.routes';
import type { BedPermission } from '@camp-registration/common/permissions';

export class BedModule implements AppModule {
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
