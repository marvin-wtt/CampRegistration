import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import bedRoutes from '#app/bed/bed.routes';
import bedService from '#app/bed/bed.service';
import { registerRouteModelBinding } from '#core/router.';

export class BedModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('bed', (req, id) => {
      const room = req.modelOrFail('room');
      return bedService.getBedById(id, room.id);
    });

    router.use('/camps/:campId/rooms/:roomId/beds', bedRoutes);
  }
}
