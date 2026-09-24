import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import config from '#config/index';
import logger from '#core/logger';
import { resolve } from '#core/ioc/container';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { MailableRegistry } from '#core/mail/mail.registry';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { PaymentService } from './payment.service.js';
import { PaymentAccountService } from './payment-account.service.js';
import { PaymentNotifier } from './payment.notifier.js';
import { PaymentSyncQueue } from './payment-sync.queue.js';
import { PaymentReminderService } from './payment-reminder.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentPublicController } from './payment-public.controller.js';
import { PaymentAccountController } from './payment-account.controller.js';
import {
  EventPaymentRouter,
  PaymentAccountRouter,
  RegistrationPaymentRouter,
} from './payment.routes.js';
import { paymentWebhookHandler } from './payment-webhook.handler.js';
import {
  fakeCheckoutComplete,
  fakeCheckoutPage,
} from './fake-checkout.handler.js';
import { PaymentSettingsValidation } from './payment.validation.js';
import { PaymentRequestedMessage } from './messages/requested.mail.js';
import { PaymentReceivedMessage } from './messages/received.mail.js';
import { PaymentFailedMessage } from './messages/failed.mail.js';
import { PaymentRefundedMessage } from './messages/refunded.mail.js';
import { PaymentReminderMessage } from './messages/reminder.mail.js';

export class PaymentModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PaymentAccountService).toSelf().inSingletonScope();
    options.bind(PaymentService).toSelf().inSingletonScope();
    options.bind(PaymentNotifier).toSelf().inSingletonScope();
    options.bind(PaymentSyncQueue).toSelf().inSingletonScope();
    options.bind(PaymentReminderService).toSelf().inSingletonScope();
    options.bind(PaymentController).toSelf().inSingletonScope();
    options.bind(PaymentPublicController).toSelf().inSingletonScope();
    options.bind(PaymentAccountController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): void {
    resolve(SettingsRegistry).register(SETTING_KEYS.PAYMENT, {
      schema: PaymentSettingsValidation,
      viewPermission: 'event.view',
      editPermission: 'event.edit',
    });

    const mailRegistry = resolve(MailableRegistry);
    mailRegistry.register(PaymentRequestedMessage);
    mailRegistry.register(PaymentReceivedMessage);
    mailRegistry.register(PaymentFailedMessage);
    mailRegistry.register(PaymentRefundedMessage);
    mailRegistry.register(PaymentReminderMessage);
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/payments', new EventPaymentRouter());
    router.useRouter(
      '/events/:eventId/registrations/:registrationId',
      new RegistrationPaymentRouter(),
    );
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
    router.post(
      '/webhooks/payments/:provider/:accountId',
      paymentWebhookHandler,
    );
  }

  registerPermissions(): ScopedPermissions {
    // Payments are participants' personal and financial data: event-scoped
    // only, never part of the organization's implicit event grant. Refunds
    // move money out, so they stay with the director.
    return {
      event: {
        DIRECTOR: [
          'event.payments.view',
          'event.payments.create',
          'event.payments.refund',
        ],
        COORDINATOR: ['event.payments.view', 'event.payments.create'],
        VIEWER: ['event.payments.view'],
      },
      organization: {
        ADMIN: ['organization.payments.view', 'organization.payments.edit'],
      },
    };
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('payment-reminders', '0 9 * * *', async () => {
      await resolve(PaymentReminderService).sendDueReminders();
    });
  }

  ready() {
    resolve(PaymentSyncQueue).startWorker();
  }
}
