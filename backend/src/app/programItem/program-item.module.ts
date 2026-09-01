import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { ProgramItemRouter } from '#app/programItem/program-item.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { ProgramItemService } from '#app/programItem/program-item.service';
import { ProgramItemController } from '#app/programItem/program-item.controller';
import { resolve } from '#core/ioc/container';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { ProgramSettingsValidation } from '#app/programItem/programItem.settings.validation';

export class ProgramItemModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ProgramItemService).toSelf().inSingletonScope();
    options.bind(ProgramItemController).toSelf().inSingletonScope();
    options.bind(ProgramItemRouter).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(SettingsRegistry).register(SETTING_KEYS.PROGRAM_PLANNER, {
      schema: ProgramSettingsValidation,
      viewPermission: 'event.program_items.view',
      editPermission: 'event.program_items.update',
    });
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/program-items',
      resolve(ProgramItemRouter),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.program_items.view',
          'event.program_items.create',
          'event.program_items.update',
          'event.program_items.delete',
        ],
        COORDINATOR: [
          'event.program_items.view',
          'event.program_items.create',
          'event.program_items.update',
          'event.program_items.delete',
        ],
        COUNSELOR: [
          'event.program_items.view',
          'event.program_items.create',
          'event.program_items.update',
          'event.program_items.delete',
        ],
        VIEWER: ['event.program_items.view'],
      },
    };
  }
}
