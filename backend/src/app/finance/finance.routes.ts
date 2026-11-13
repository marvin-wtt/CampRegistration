import { inject, injectable } from 'inversify';
import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { hasEventPermission, hasEventView } from '#app/event/event.guard';
import { financeMember } from '#app/finance/finance.guard';
import { FinanceController } from '#app/finance/finance.controller';

@injectable()
export class FinanceRouter extends ModuleRouter {
  constructor(
    @inject(FinanceController)
    private readonly financeController: FinanceController,
  ) {
    super();
  }

  protected registerBindings() {
    // Every route acts on the event bound by the parent router.
  }

  protected defineRoutes() {
    this.router.use(auth());

    this.router.get(
      '/balances',
      guard(hasEventView('event.expenses.view')),
      controller(this.financeController, 'balances'),
    );
    this.router.get(
      '/summary',
      guard(hasEventPermission('event.expenses.view')),
      controller(this.financeController, 'summary'),
    );
    this.router.get(
      '/export',
      guard(hasEventPermission('event.expenses.view')),
      controller(this.financeController, 'exportData'),
    );
    this.router.get(
      '/receipts',
      guard(hasEventPermission('event.expenses.view')),
      controller(this.financeController, 'receipts'),
    );
    this.router.get(
      '/parties',
      guard(financeMember),
      controller(this.financeController, 'parties'),
    );
    this.router.get(
      '/settings',
      guard(financeMember),
      controller(this.financeController, 'showSettings'),
    );
    this.router.patch(
      '/settings',
      guard(hasEventPermission('event.finances.configure')),
      controller(this.financeController, 'updateSettings'),
    );
  }
}
