import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { ProgramEventRouter } from '#app/programEvent/program-event.routes';
import type { ProgramEventPermission } from '@camp-registration/common/permissions';

export class ProgramEventModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/camps/:campId/program-events', new ProgramEventRouter());
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
