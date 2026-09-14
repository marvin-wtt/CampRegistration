import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { resolve } from '#core/ioc/container';
import { ProgramPublishedDayService } from './program-published-day.service.js';
import { ProgramPublishedDayController } from './program-published-day.controller.js';
import { ProgramPublishedDayRouter } from './program-published-day.routes.js';

/**
 * A published day is a sub-resource of an event's program — same shape as
 * `bed` under `room`: its own module, nested under the owning resource's
 * path, rather than methods bolted onto `ProgramPublicModule` (which stays
 * focused on the anonymous public view/stream). Permissions are reused from
 * `ProgramItemModule` (`event.program_items.view`/`.update`) rather than
 * declared here — a published day is meaningless without the items it
 * publishes, so it doesn't own a permission scope of its own.
 */
export class ProgramPublishedDayModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ProgramPublishedDayService).toSelf().inSingletonScope();
    options.bind(ProgramPublishedDayController).toSelf().inSingletonScope();
    options.bind(ProgramPublishedDayRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/program-public/days',
      resolve(ProgramPublishedDayRouter),
    );
  }
}
