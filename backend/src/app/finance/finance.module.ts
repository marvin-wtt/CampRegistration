import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { AccountLifecycle } from '#app/user/account.lifecycle';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { FinanceService } from '#app/finance/finance.service';
import { FinancePartyService } from '#app/finance/finance-party.service';
import { FinanceController } from '#app/finance/finance.controller';
import { FinanceRouter } from '#app/finance/finance.routes';
import { FinanceDisplaySettingsValidation } from '#app/finance/finance.settings.validation';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { SETTING_KEYS } from '@camp-registration/common/settings';

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

  configure(): void {
    // Not personal data: every manager's list follows it.
    resolve(SettingsRegistry).register(SETTING_KEYS.FINANCES, {
      schema: FinanceDisplaySettingsValidation,
      viewPermission: 'event.view',
      editPermission: 'event.finances.configure',
    });
    resolve(AccountLifecycle).onDeleting((account) =>
      resolve(FinancePartyService).keepAccountName(account),
    );
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
