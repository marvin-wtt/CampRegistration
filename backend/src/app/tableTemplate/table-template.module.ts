import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import { TableTemplateRouter } from '#app/tableTemplate/table-template.routes';
import type { TableTemplatePermission } from '@camp-registration/common/permissions';

export class TableTemplateModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/camps/:campId/table-templates',
      new TableTemplateRouter(),
    );
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
