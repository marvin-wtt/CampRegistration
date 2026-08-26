import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { BedRouter } from '#app/bed/bed.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { BedService } from '#app/bed/bed.service';
import { BedController } from '#app/bed/bed.controller';

export class BedModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(BedService).toSelf().inSingletonScope();
    options.bind(BedController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/rooms/:roomId/beds', new BedRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.rooms.beds.create',
          'event.rooms.beds.edit',
          'event.rooms.beds.delete',
        ],
        COORDINATOR: [
          'event.rooms.beds.create',
          'event.rooms.beds.edit',
          'event.rooms.beds.delete',
        ],
        COUNSELOR: ['event.rooms.beds.edit'],
        VIEWER: [],
      },
    };
  }
}
