import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import tableTemplateRoutes from '#app/tableTemplate/table-template.routes';
import { registerRouteModelBinding } from '#core/router';
import tableTemplateService from '#app/tableTemplate/table-template.service';

export class TableTemplateModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('tableTemplate', (req, id) => {
      const camp = req.modelOrFail('camp');
      return tableTemplateService.getTemplateById(camp.id, id);
    });

    router.use('/camps/:campId/table-templates', tableTemplateRoutes);
  }
}
