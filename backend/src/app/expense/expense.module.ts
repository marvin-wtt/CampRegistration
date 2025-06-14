import type {
  AppModule,
  ModuleOptions,
  RoleToPermissions,
} from '#core/base/AppModule';
import type { ExpensePermission } from '@camp-registration/common/permissions';
import { registerRouteModelBinding } from '#core/router';
import expenseService from '#app/expense/expense.service';
import expenseRoutes from '#app/expense/expense.routes';
import { registerFileGuard } from '#app/file/file.guard';
import campService from '#app/camp/camp.service.js';
import { campManager, type GuardFn } from '#guards/index';
import type { Request } from 'express';

export class ExpenseModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('expense', async (req, id) => {
      const camp = req.modelOrFail('camp');
      return expenseService.getExpenseById(camp.id, id);
    });

    registerFileGuard('expense', this.fileGuard);

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
