import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import managerRoutes from '#app/manager/manager.routes';
import { registerRouteModelBinding } from '#core/router';
import managerService from '#app/manager/manager.service';

export class ManagerModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('manager', (req, id) => {
      const camp = req.modelOrFail('camp');
      return managerService.getManagerById(camp.id, id);
    });

    router.use('/camps/:campId/managers', managerRoutes);
  }
}
