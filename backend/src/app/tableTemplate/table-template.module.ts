import type {
  AppModule,
  AppRouter,
  BindOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import { TableTemplateRouter } from '#app/tableTemplate/table-template.routes';
import type { TableTemplatePermission } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { TableTemplateService } from '#app/tableTemplate/table-template.service';
import { TableTemplateController } from '#app/tableTemplate/table-template.controller';

export class TableTemplateModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TableTemplateService).toSelf().inSingletonScope();
    options.bind(TableTemplateController).toSelf().inSingletonScope();
    options.bind(TableTemplateRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter(
      '/camps/:campId/table-templates',
      resolve(TableTemplateRouter),
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
