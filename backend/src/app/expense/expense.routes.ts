import { inject, injectable } from 'inversify';
import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { hasEventPermission, hasEventView } from '#app/event/event.guard';
import { ExpenseService } from '#app/expense/expense.service';
import { ExpenseController } from '#app/expense/expense.controller';

@injectable()
export class ExpenseRouter extends ModuleRouter {
  constructor(
    @inject(ExpenseService) private readonly expenseService: ExpenseService,
    @inject(ExpenseController)
    private readonly expenseController: ExpenseController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel(
      'expense',
      (req, id) => {
        const event = req.modelOrFail('event');
        return this.expenseService.getExpenseById(event.id, id);
      },
      { ownedBy: ['createdByUserId', 'paidByUserId'] },
    );
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventView('event.expenses.view')),
      controller(this.expenseController, 'index'),
    );
    this.router.get(
      '/:expenseId',
      guard(hasEventPermission('event.expenses.view', { own: 'expense' })),
      controller(this.expenseController, 'show'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.expenses.create')),
      controller(this.expenseController, 'store'),
    );
    this.router.patch(
      '/:expenseId',
      guard(hasEventPermission('event.expenses.edit', { own: 'expense' })),
      controller(this.expenseController, 'update'),
    );
    this.router.delete(
      '/:expenseId',
      guard(hasEventPermission('event.expenses.delete', { own: 'expense' })),
      controller(this.expenseController, 'destroy'),
    );
  }
}
