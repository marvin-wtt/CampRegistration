import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { DutyRouter } from '#app/duty/duty.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { DutyService } from '#app/duty/duty.service';
import { DutyController } from '#app/duty/duty.controller';
import { resolve } from '#core/ioc/container';

export class DutyModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(DutyService).toSelf().inSingletonScope();
    options.bind(DutyController).toSelf().inSingletonScope();
    options.bind(DutyRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/duties', resolve(DutyRouter));
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.duties.view',
          'event.duties.create',
          'event.duties.edit',
          'event.duties.delete',
        ],
        COORDINATOR: [
          'event.duties.view',
          'event.duties.create',
          'event.duties.edit',
          'event.duties.delete',
        ],
        COUNSELOR: [
          'event.duties.view',
          'event.duties.create',
          'event.duties.edit',
          'event.duties.delete',
        ],
        VIEWER: ['event.duties.view'],
      },
    };
  }
}
