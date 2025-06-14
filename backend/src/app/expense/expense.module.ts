import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import type { ExpensePermission } from '@camp-registration/common/permissions';
import { registerRouteModelBinding } from '#core/router';
import expenseService from '#app/expense/expense.service';
import expenseRoutes from '#app/expense/expense.routes';

export class ExpenseModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('expense', async (req, id) => {
      const camp = req.modelOrFail('camp');
      return expenseService.getExpenseById(camp.id, id);
    });

    router.use('/camps/:campId/expenses', expenseRoutes);
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

export default new ExpenseModule();
