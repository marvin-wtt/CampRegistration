import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import { resolve } from '#core/ioc/container';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { MailableRegistry } from '#core/mail/mail.registry';
import { SettingsRegistry } from '#app/setting/setting.registry';
import { PaymentService } from './payment.service.js';
import { PaymentReconciliationService } from './payment-reconciliation.service.js';
import { PaymentNotifier } from './payment.notifier.js';
import { PaymentReconciliationQueue } from './payment-reconciliation.queue.js';
import { PaymentReminderService } from './payment-reminder.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentPublicController } from './payment-public.controller.js';
import {
  EventPaymentRouter,
  RegistrationPaymentRouter,
} from './payment.routes.js';
import { paymentWebhookHandler } from './payment-webhook.handler.js';
import { PaymentSettingsValidation } from './payment.validation.js';
import { PaymentRequestedMessage } from './messages/requested.mail.js';
import { PaymentReceivedMessage } from './messages/received.mail.js';
import { PaymentFailedMessage } from './messages/failed.mail.js';
import { PaymentRefundedMessage } from './messages/refunded.mail.js';
import { PaymentReminderMessage } from './messages/reminder.mail.js';

export class PaymentModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PaymentService).toSelf().inSingletonScope();
    options.bind(PaymentReconciliationService).toSelf().inSingletonScope();
    options.bind(PaymentNotifier).toSelf().inSingletonScope();
    options.bind(PaymentReconciliationQueue).toSelf().inSingletonScope();
    options.bind(PaymentReminderService).toSelf().inSingletonScope();
    options.bind(PaymentController).toSelf().inSingletonScope();
    options.bind(PaymentPublicController).toSelf().inSingletonScope();
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
    router.post(
      '/webhooks/payments/:provider/:accountId',
      paymentWebhookHandler,
    );
  }

  registerPermissions(): ScopedPermissions {
    // Payments are participants' personal and financial data: event-scoped
    // only, never part of the organization's implicit event grant. Refunds
    // and changes to what someone owes give money up, so they stay with the
    // director.
    return {
      event: {
        DIRECTOR: [
          'event.payments.view',
          'event.payments.create',
          'event.payments.refund',
          'event.payments.adjust',
        ],
        COORDINATOR: ['event.payments.view', 'event.payments.create'],
        VIEWER: ['event.payments.view'],
      },
    };
  }

  registerJobs(scheduler: JobScheduler): void {
    // Accounting records outlive their registration only as long as the law
    // requires; then just the anonymous amounts remain.
    scheduler.schedule('payment-record-retention', '0 4 1 * *', async () => {
      await resolve(PaymentService).anonymizeExpiredPayers();
    });
    scheduler.schedule('payment-reminders', '0 9 * * *', async () => {
      const service = resolve(PaymentReminderService);
      // Requests first: a reminder counts from the request.
      await service.sendDueRequests();
      await service.sendDueReminders();
    });
  }

  ready() {
    resolve(PaymentReconciliationQueue).startWorker();
  }
}
