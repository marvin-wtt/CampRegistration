import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { resolve } from '#core/ioc/container';
import { FinanceCategoryService } from '#app/financeCategory/finance-category.service';
import { FinanceCategoryController } from '#app/financeCategory/finance-category.controller';
import { FinanceCategoryRouter } from '#app/financeCategory/finance-category.routes';

// Permissions are granted by the finance module.
export class FinanceCategoryModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(FinanceCategoryService).toSelf().inSingletonScope();
    options.bind(FinanceCategoryController).toSelf().inSingletonScope();
    options.bind(FinanceCategoryRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/finance-categories',
      resolve(FinanceCategoryRouter),
    );
  }
}
