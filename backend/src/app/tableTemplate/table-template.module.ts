import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { TableTemplateRouter } from '#app/tableTemplate/table-template.routes';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
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
      '/events/:eventId/table-templates',
      resolve(TableTemplateRouter),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.table_templates.view',
          'event.table_templates.create',
          'event.table_templates.edit',
          'event.table_templates.delete',
        ],
        COORDINATOR: [
          'event.table_templates.view',
          'event.table_templates.create',
          'event.table_templates.edit',
          'event.table_templates.delete',
        ],
        COUNSELOR: ['event.table_templates.view'],
        VIEWER: ['event.table_templates.view'],
      },
    };
  }
}
