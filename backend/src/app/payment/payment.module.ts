import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { resolve } from '#core/ioc/container';
import { PaymentService } from '#app/payment/payment.service';
import { PaymentController } from '#app/payment/payment.controller';
import { PaymentRouter } from '#app/payment/payment.routes';

export class PaymentModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PaymentService).toSelf().inSingletonScope();
    options.bind(PaymentController).toSelf().inSingletonScope();
    options.bind(PaymentRouter).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/events/:eventId/payments', resolve(PaymentRouter));
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('payment-record-retention', '15 4 1 * *', async () => {
      await resolve(PaymentService).clearExpiredPayerNames();
    });
  }

  registerPermissions(): ScopedPermissions {
    // Event-scoped only: never part of an organization admin's implicit
    // grant. The treasurer works on fees without registration access.
    const all = [
      'event.payments.view',
      'event.payments.create',
      'event.payments.refund',
      'event.payments.adjust',
    ] as const;

    return {
      event: {
        DIRECTOR: [...all],
        TREASURER: [...all],
        COORDINATOR: ['event.payments.view', 'event.payments.create'],
        VIEWER: ['event.payments.view'],
      },
    };
  }
}
