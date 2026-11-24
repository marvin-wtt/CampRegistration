import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { registerFileGuard } from '#app/file/file.guard';
import { IncomeService } from '#app/income/income.service';
import { IncomeController } from '#app/income/income.controller';
import { IncomeRouter } from '#app/income/income.routes';
import { incomeFileGuard } from '#app/income/income.guard';

export class IncomeModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(IncomeService).toSelf().inSingletonScope();
    options.bind(IncomeController).toSelf().inSingletonScope();
    options.bind(IncomeRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    // Documents are attached and removed through the income itself.
    registerFileGuard('income', { view: incomeFileGuard });

    router.useRouter('/events/:eventId/incomes', resolve(IncomeRouter));
  }

  // Coordinators and counselors record no income: it is the treasurer's.
  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.income.create',
          'event.income.edit',
          'event.income.delete',
        ],
        TREASURER: [
          'event.income.create',
          'event.income.edit',
          'event.income.delete',
        ],
      },
    };
  }
}
