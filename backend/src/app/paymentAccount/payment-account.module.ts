import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import config from '#config/index';
import logger from '#core/logger';
import { secretsAvailable } from '#core/secrets';
import { PaymentAccountService } from './payment-account.service.js';
import { PaymentAccountController } from './payment-account.controller.js';
import { PaymentAccountRouter } from './payment-account.routes.js';
import {
  fakeCheckoutComplete,
  fakeCheckoutPage,
} from './providers/fake/fake-checkout.handler.js';

/**
 * An organization's connection to a payment provider, and the providers
 * themselves. The payment ledger builds on it; it knows nothing of payments.
 */
export class PaymentAccountModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PaymentAccountService).toSelf().inSingletonScope();
    options.bind(PaymentAccountController).toSelf().inSingletonScope();
  }

  // Parsing here makes a malformed key fail the boot, not the first request.
  configure(_options: ModuleOptions): void {
    if (!secretsAvailable()) {
      logger.warn(
        'SECRETS_ENCRYPTION_KEYS is not set — organizations cannot connect payment accounts, and connected ones cannot be used',
      );
    }
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter(
      '/organizations/:organizationId/payment-account',
      new PaymentAccountRouter(),
    );

    if (config.payment.fakeProvider) {
      logger.warn(
        'PAYMENT_FAKE_PROVIDER is enabled: payments can be settled without real money.',
      );
      router.get(
        '/webhooks/payments/fake/checkout/:paymentId',
        fakeCheckoutPage,
      );
      router.get(
        '/webhooks/payments/fake/checkout/:paymentId/complete',
        fakeCheckoutComplete,
      );
    }
  }

  registerPermissions(): ScopedPermissions {
    return {
      organization: {
        ADMIN: ['organization.payments.view', 'organization.payments.edit'],
      },
    };
  }
}
