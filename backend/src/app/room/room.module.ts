import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import roomRoutes from '#app/room/room.routes';
import { registerRouteModelBinding } from '#core/router.';
import roomService from '#app/room/room.service';

export class RoomModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('room', (req, id) => {
      const camp = req.modelOrFail('camp');
      return roomService.getRoomById(camp.id, id);
    });

    router.use('/camps/:campId/rooms', roomRoutes);
  }
}
