import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import roomRoutes from '#app/room/room.routes';
import { registerRouteModelBinding } from '#core/router';
import roomService from '#app/room/room.service';
import type { RoomPermission } from '@camp-registration/common/permissions';

export class RoomModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('room', (req, id) => {
      const camp = req.modelOrFail('camp');
      return roomService.getRoomById(camp.id, id);
    });

    router.use('/camps/:campId/rooms', roomRoutes);
  }

  registerPermissions(): RoleToPermissions<RoomPermission> {
    return {
      DIRECTOR: [
        'camp.rooms.view',
        'camp.rooms.create',
        'camp.rooms.edit',
        'camp.rooms.delete',
      ],
      COORDINATOR: [
        'camp.rooms.view',
        'camp.rooms.create',
        'camp.rooms.edit',
        'camp.rooms.delete',
      ],
      COUNSELOR: ['camp.rooms.view'],
      VIEWER: ['camp.rooms.view'],
    };
  }
}
