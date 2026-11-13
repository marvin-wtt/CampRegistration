import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { FinanceService } from '#app/finance/finance.service';
import { FinancePartyService } from '#app/finance/finance-party.service';
import { FinanceController } from '#app/finance/finance.controller';
import { FinanceRouter } from '#app/finance/finance.routes';

/**
 * Balances, summary and finance settings. Expense and payout grants live in
 * their own modules.
 */
export class FinanceModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(FinanceService).toSelf().inSingletonScope();
    options.bind(FinancePartyService).toSelf().inSingletonScope();
    options.bind(FinanceController).toSelf().inSingletonScope();
    options.bind(FinanceRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/finances', resolve(FinanceRouter));
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: ['event.finances.configure'],
        TREASURER: ['event.finances.configure'],
      },
    };
  }
}
