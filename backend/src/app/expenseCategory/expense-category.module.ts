import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { resolve } from '#core/ioc/container';
import { ExpenseCategoryService } from '#app/expenseCategory/expense-category.service';
import { ExpenseCategoryController } from '#app/expenseCategory/expense-category.controller';
import { ExpenseCategoryRouter } from '#app/expenseCategory/expense-category.routes';

// Permissions are granted by the finance module.
export class ExpenseCategoryModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ExpenseCategoryService).toSelf().inSingletonScope();
    options.bind(ExpenseCategoryController).toSelf().inSingletonScope();
    options.bind(ExpenseCategoryRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/events/:eventId/expense-categories',
      resolve(ExpenseCategoryRouter),
    );
  }
}
