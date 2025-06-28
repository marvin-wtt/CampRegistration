import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import type { ExpensePermission } from '@camp-registration/common/permissions';
import { ExpenseRouter } from '#app/expense/expense.routes';
import { registerFileGuard } from '#app/file/file.guard';
import { expenseFileGuard } from '#app/expense/expense.guard';

export class ExpenseModule implements AppModule {
  registerRoutes(router: AppRouter) {
    registerFileGuard('expense', expenseFileGuard);

    router.useRouter('/camps/:campId/expenses', new ExpenseRouter());
  }

  registerPermissions(): RoleToPermissions<ExpensePermission> {
    return {
      DIRECTOR: [
        'camp.expenses.view',
        'camp.expenses.create',
        'camp.expenses.edit',
        'camp.expenses.delete',
      ],
      COORDINATOR: [
        'camp.expenses.view',
        'camp.expenses.create',
        'camp.expenses.edit',
        'camp.expenses.delete',
      ],
      COUNSELOR: ['camp.expenses.view', 'camp.expenses.create'],
      VIEWER: [],
    };
  }
}
