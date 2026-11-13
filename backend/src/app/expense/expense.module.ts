import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { registerFileGuard } from '#app/file/file.guard';
import { ExpenseService } from '#app/expense/expense.service';
import { ExpenseController } from '#app/expense/expense.controller';
import { ExpenseRouter } from '#app/expense/expense.routes';
import { expenseFileGuard } from '#app/expense/expense.guard';

export class ExpenseModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ExpenseService).toSelf().inSingletonScope();
    options.bind(ExpenseController).toSelf().inSingletonScope();
    options.bind(ExpenseRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    // Receipt files are attached and removed through the expense itself.
    registerFileGuard('expense', { view: expenseFileGuard });

    router.useRouter('/events/:eventId/expenses', resolve(ExpenseRouter));
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.expenses.view',
          'event.expenses.create',
          'event.expenses.edit',
          'event.expenses.delete',
        ],
        TREASURER: [
          'event.expenses.view',
          'event.expenses.create',
          'event.expenses.edit',
          'event.expenses.delete',
        ],
        COORDINATOR: [
          'event.expenses.view',
          'event.expenses.create',
          'event.expenses.edit',
          'event.expenses.delete',
        ],
        // Names, amounts and receipts are personal data: only their own.
        COUNSELOR: [
          'event.expenses.create',
          'event.expenses.view:own',
          'event.expenses.edit:own',
          'event.expenses.delete:own',
        ],
      },
    };
  }
}
