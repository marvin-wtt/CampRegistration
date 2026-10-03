import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { resolve } from '#core/ioc/container';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { InvoiceService } from './invoice.service.js';
import { InvoiceIssuedMessage } from './billing.messages.js';
import { MailableRegistry } from '#core/mail/mail.registry';
import {
  EventBillingRouter,
  EventBillRouter,
  OrganizationBillingRouter,
} from './billing.routes.js';

export class BillingModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(BillingService).toSelf().inSingletonScope();
    options.bind(InvoiceService).toSelf().inSingletonScope();
    options.bind(BillingController).toSelf().inSingletonScope();
  }

  configure() {
    resolve(MailableRegistry).register(InvoiceIssuedMessage);
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/bills', new EventBillRouter());
    router.useRouter(
      '/organizations/:organizationId/billing',
      new OrganizationBillingRouter(),
    );
    router.useRouter('/events/:eventId/billing', new EventBillingRouter());
  }

  registerPermissions(): ScopedPermissions {
    return {
      event: {
        DIRECTOR: ['event.billing.view'],
        COORDINATOR: ['event.billing.view'],
      },
      organization: {
        ADMIN: ['organization.billing.view'],
      },
    };
  }

  registerJobs(scheduler: JobScheduler): void {
    // Offset from each other so a bill opened and finalized in the same
    // quarter-hour (a very short event) is handled in order.
    scheduler.schedule('billing-open-drafts', '*/15 * * * *', () =>
      resolve(BillingService).openDraftsForStartedEvents(),
    );
    scheduler.schedule('billing-finalize', '5-59/15 * * * *', () =>
      resolve(BillingService).finalizeEndedEvents(),
    );
  }
}
