import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { PayoutService } from '#app/payout/payout.service';
import { PayoutController } from '#app/payout/payout.controller';
import { PayoutRouter } from '#app/payout/payout.routes';

export class PayoutModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PayoutService).toSelf().inSingletonScope();
    options.bind(PayoutController).toSelf().inSingletonScope();
    options.bind(PayoutRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/payouts', resolve(PayoutRouter));
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: [
          'event.payouts.view',
          'event.payouts.create',
          'event.payouts.edit',
          'event.payouts.sign',
          'event.payouts.delete',
        ],
        TREASURER: [
          'event.payouts.view',
          'event.payouts.create',
          'event.payouts.edit',
          'event.payouts.sign',
          'event.payouts.delete',
        ],
        COORDINATOR: [
          'event.payouts.view',
          'event.payouts.create',
          'event.payouts.edit',
          'event.payouts.sign',
          'event.payouts.delete',
        ],
        // See and sign the payouts made to them.
        COUNSELOR: ['event.payouts.view:own', 'event.payouts.sign:own'],
      },
    };
  }
}
