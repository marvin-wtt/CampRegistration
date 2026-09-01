import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { RoomRouter } from '#app/room/room.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { resolve } from '#core/ioc/container';
import { RoomController } from '#app/room/room.controller.js';
import { RoomService } from '#app/room/room.service.js';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { RoomSettingsValidation } from '#app/room/room.settings.validation';

export class RoomModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(RoomController).toSelf().inSingletonScope();
    options.bind(RoomService).toSelf().inSingletonScope();
    options.bind(RoomRouter).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(SettingsRegistry).register(SETTING_KEYS.ROOM_PLANNER, {
      schema: RoomSettingsValidation,
      viewPermission: 'event.rooms.view',
      editPermission: 'event.rooms.edit',
    });
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/rooms', resolve(RoomRouter));
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.rooms.view',
          'event.rooms.create',
          'event.rooms.edit',
          'event.rooms.delete',
        ],
        COORDINATOR: [
          'event.rooms.view',
          'event.rooms.create',
          'event.rooms.edit',
          'event.rooms.delete',
        ],
        COUNSELOR: ['event.rooms.view'],
        VIEWER: ['event.rooms.view'],
      },
    };
  }
}
