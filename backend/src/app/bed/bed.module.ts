import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import bedRoutes from '#app/bed/bed.routes';
import bedService from '#app/bed/bed.service';
import { registerRouteModelBinding } from '#core/router';
import type { BedPermission } from '@camp-registration/common/permissions';

export class BedModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('bed', (req, id) => {
      const room = req.modelOrFail('room');
      return bedService.getBedById(id, room.id);
    });

    router.use('/camps/:campId/rooms/:roomId/beds', bedRoutes);
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
