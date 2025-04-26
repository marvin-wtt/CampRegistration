import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import tableTemplateRoutes from '#app/tableTemplate/table-template.routes';
import { registerRouteModelBinding } from '#core/router';
import tableTemplateService from '#app/tableTemplate/table-template.service';
import type { TableTemplatePermission } from '@camp-registration/common/permissions';

export class TableTemplateModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('tableTemplate', (req, id) => {
      const camp = req.modelOrFail('camp');
      return tableTemplateService.getTemplateById(camp.id, id);
    });

    router.use('/camps/:campId/table-templates', tableTemplateRoutes);
  }

  registerPermissions(): RoleToPermissions<TableTemplatePermission> {
    return {
      DIRECTOR: [
        'camp.table_templates.view',
        'camp.table_templates.create',
        'camp.table_templates.edit',
        'camp.table_templates.delete',
      ],
      COORDINATOR: [
        'camp.table_templates.view',
        'camp.table_templates.create',
        'camp.table_templates.edit',
        'camp.table_templates.delete',
      ],
      COUNSELOR: ['camp.table_templates.view'],
      VIEWER: ['camp.table_templates.view'],
    };
  }
}
