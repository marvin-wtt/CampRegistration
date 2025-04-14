import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import managerRoutes from '#app/manager/manager.routes';

export class ManagerModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/camps/:campId/managers', managerRoutes);
  }
}
