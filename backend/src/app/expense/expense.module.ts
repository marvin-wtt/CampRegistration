import type {
  AppModule,
  AppRouter,
  RoleToPermissions,
} from '#core/base/AppModule';
import type { ExpensePermission } from '@camp-registration/common/permissions';
import expenseService from '#app/expense/expense.service';
import { ExpenseRouter } from '#app/expense/expense.routes';
import campService from '#app/camp/camp.service';
import { campManager, type GuardFn } from '#guards/index';
import type { Request } from 'express';
import { registerFileGuard } from '#app/file/file.guard.js';

export class ExpenseModule implements AppModule {
  registerRoutes(router: AppRouter) {
    registerFileGuard('expense', this.fileGuard);

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

  private fileGuard = async (req: Request): Promise<GuardFn> => {
    const file = req.modelOrFail('file');

    if (!file.expenseId) {
      throw new Error('Invalid guard handler: expenseId not found in file');
    }

    const expense = await expenseService.getExpenseWithCampById(file.expenseId);
    if (!expense) {
      throw new Error('Expense related to file not found');
    }
    const camp = await campService.getCampById(expense.camp.id);

    req.setModelOrFail('expense', expense);
    req.setModelOrFail('camp', camp);

    return campManager('camp.expenses.view');
  };
}

export default new ExpenseModule();
