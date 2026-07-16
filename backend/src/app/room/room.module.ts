import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { RoomRouter } from '#app/room/room.routes';
import type {
  CampManagerRole,
  RoomPermission,
} from '@camp-registration/common/permissions';
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
      viewPermission: 'camp.rooms.view',
      editPermission: 'camp.rooms.edit',
    });
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/rooms', resolve(RoomRouter));
  }

  registerPermissions(): RoleToPermissions<CampManagerRole, RoomPermission> {
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
