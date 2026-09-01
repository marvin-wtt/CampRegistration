import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { ChoreRouter } from '#app/chore/chore.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { ChoreService } from '#app/chore/chore.service';
import { ChoreController } from '#app/chore/chore.controller';
import { resolve } from '#core/ioc/container';

export class ChoreModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ChoreService).toSelf().inSingletonScope();
    options.bind(ChoreController).toSelf().inSingletonScope();
    options.bind(ChoreRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/chores', resolve(ChoreRouter));
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.chores.view',
          'event.chores.create',
          'event.chores.edit',
          'event.chores.delete',
        ],
        COORDINATOR: [
          'event.chores.view',
          'event.chores.create',
          'event.chores.edit',
          'event.chores.delete',
        ],
        COUNSELOR: [
          'event.chores.view',
          'event.chores.create',
          'event.chores.edit',
          'event.chores.delete',
        ],
        VIEWER: ['event.chores.view'],
      },
    };
  }
}
