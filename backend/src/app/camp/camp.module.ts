import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import campRoutes from '#app/camp/camp.routes';
import { registerRouteModelBinding } from '#core/router.';
import campService from '#app/camp/camp.service';

export class CampModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('camp', (_req, id) =>
      campService.getCampById(id),
    );

    router.use('/camps', campRoutes);
  }
}
