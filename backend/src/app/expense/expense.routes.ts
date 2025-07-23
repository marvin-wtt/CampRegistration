import { auth, guard, multipart } from '#middlewares/index';
import { campManager } from '#guards/index';
import expenseController from '#app/expense/expense.controller';
import expenseService from '#app/expense/expense.service';
import { controller } from '#utils/bindController';
import { ModuleRouter } from '#core/router/ModuleRouter.js';

export class ExpenseRouter extends ModuleRouter {
  protected registerBindings() {
    this.bindModel('expense', async (req, id) => {
      const camp = req.modelOrFail('camp');
      return expenseService.getExpenseById(camp.id, id);
    });
  }

  protected defineRoutes() {
    this.router.get(
      '/',
      guard(campManager('camp.expenses.view')),
      controller(expenseController, 'index'),
    );
    this.router.get(
      '/:expenseId',
      guard(campManager('camp.expenses.view')),
      controller(expenseController, 'show'),
    );
    this.router.post(
      '/',
      auth(),
      guard(campManager('camp.expenses.create')),
      multipart('file'),
      controller(expenseController, 'store'),
    );
    this.router.patch(
      '/:expenseId',
      auth(),
      guard(campManager('camp.expenses.edit')),
      multipart('file'),
      controller(expenseController, 'update'),
    );
    this.router.delete(
      '/:expenseId',
      auth(),
      guard(campManager('camp.expenses.delete')),
      controller(expenseController, 'destroy'),
    );
  }
}
