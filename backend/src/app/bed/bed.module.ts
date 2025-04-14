import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import bedRoutes from '#app/bed/bed.routes';

export class BedModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/:campId/rooms/:roomId/beds', bedRoutes);
  }
}
