import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import tableTemplateRoutes from '#app/tableTemplate/table-template.routes';

export class TableTemplateModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/camps/:campId/table-templates', tableTemplateRoutes);
  }
}
