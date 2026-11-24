import { inject, injectable } from 'inversify';
import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { hasEventPermission } from '#app/event/event.guard';
import { IncomeService } from '#app/income/income.service';
import { IncomeController } from '#app/income/income.controller';

@injectable()
export class IncomeRouter extends ModuleRouter {
  constructor(
    @inject(IncomeService) private readonly incomeService: IncomeService,
    @inject(IncomeController)
    private readonly incomeController: IncomeController,
  ) {
    super();
  }

  protected registerBindings() {
    this.bindModel('income', (req, id) => {
      const event = req.modelOrFail('event');
      return this.incomeService.getIncomeById(event.id, id);
    });
  }

  // Seeing income goes with the full expense view; it is the event's own
  // money, never someone's balance.
  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/',
      guard(hasEventPermission('event.expenses.view')),
      controller(this.incomeController, 'index'),
    );
    this.router.get(
      '/:incomeId',
      guard(hasEventPermission('event.expenses.view')),
      controller(this.incomeController, 'show'),
    );
    this.router.post(
      '/',
      guard(hasEventPermission('event.income.create')),
      controller(this.incomeController, 'store'),
    );
    this.router.patch(
      '/:incomeId',
      guard(hasEventPermission('event.income.edit')),
      controller(this.incomeController, 'update'),
    );
    this.router.delete(
      '/:incomeId',
      guard(hasEventPermission('event.income.delete')),
      controller(this.incomeController, 'destroy'),
    );
  }
}
