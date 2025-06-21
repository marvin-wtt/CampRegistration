import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { RoomRouter } from '#app/room/room.routes';
import type { RoomPermission } from '@camp-registration/common/permissions';

export class RoomModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/rooms', new RoomRouter());
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
