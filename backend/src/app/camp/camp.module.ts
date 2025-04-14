import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import campRoutes from '#app/camp/camp.routes';

export class CampModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/camps', campRoutes);
  }
}
