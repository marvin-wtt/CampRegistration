import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { ProgramEventRouter } from '#app/programEvent/program-event.routes';
import type {
  CampManagerRole,
  ProgramEventPermission,
} from '@camp-registration/common/permissions';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { ProgramEventService } from '#app/programEvent/program-event.service';
import { ProgramEventController } from '#app/programEvent/program-event.controller';
import { resolve } from '#core/ioc/container';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { ProgramSettingsValidation } from '#app/programEvent/program.settings.validation';

export class ProgramEventModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ProgramEventService).toSelf().inSingletonScope();
    options.bind(ProgramEventController).toSelf().inSingletonScope();
    options.bind(ProgramEventRouter).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(SettingsRegistry).register(SETTING_KEYS.PROGRAM_PLANNER, {
      schema: ProgramSettingsValidation,
      viewPermission: 'camp.program_events.view',
      editPermission: 'camp.program_events.update',
    });
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/camps/:campId/program-events',
      resolve(ProgramEventRouter),
    );
  }

  registerPermissions(): RoleToPermissions<
    CampManagerRole,
    ProgramEventPermission
  > {
    return {
      DIRECTOR: [
        'camp.program_events.view',
        'camp.program_events.create',
        'camp.program_events.update',
        'camp.program_events.delete',
      ],
      COORDINATOR: [
        'camp.program_events.view',
        'camp.program_events.create',
        'camp.program_events.update',
        'camp.program_events.delete',
      ],
      COUNSELOR: [
        'camp.program_events.view',
        'camp.program_events.create',
        'camp.program_events.update',
        'camp.program_events.delete',
      ],
      VIEWER: ['camp.program_events.view'],
    };
  }
}
