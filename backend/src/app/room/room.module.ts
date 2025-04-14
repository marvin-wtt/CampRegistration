import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import roomRoutes from '#app/room/room.routes';

export class RoomModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/camps/:campId/rooms', roomRoutes);
  }
}
