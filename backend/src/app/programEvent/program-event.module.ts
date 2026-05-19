import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
  BindOptions,
} from '#core/base/AppModule';
import { ProgramEventRouter } from '#app/programEvent/program-event.routes';
import type { ProgramEventPermission } from '@camp-registration/common/permissions';
import { ProgramEventService } from '#app/programEvent/program-event.service';
import { ProgramEventController } from '#app/programEvent/program-event.controller';
import { resolve } from '#core/ioc/container';

export class ProgramEventModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ProgramEventService).toSelf().inSingletonScope();
    options.bind(ProgramEventController).toSelf().inSingletonScope();
    options.bind(ProgramEventRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/camps/:campId/program-events',
      resolve(ProgramEventRouter),
    );
  }

  registerPermissions(): RoleToPermissions<ProgramEventPermission> {
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
      COUNSELOR: ['camp.program_events.view'],
      VIEWER: ['camp.program_events.view'],
    };
  }
}
