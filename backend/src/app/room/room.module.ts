import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
} from '#core/base/AppModule';
import { RoomRouter } from '#app/room/room.routes';
import type { RoomPermission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { RoomController } from '#app/room/room.controller.js';
import { RoomService } from '#app/room/room.service.js';

export class RoomModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(RoomController).toSelf().inSingletonScope();
    options.bind(RoomService).toSelf().inSingletonScope();
    options.bind(RoomRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/rooms', resolve(RoomRouter));
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
