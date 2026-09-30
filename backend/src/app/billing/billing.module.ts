import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { resolve } from '#core/ioc/container';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { PriceModelService } from './price-model.service.js';
import {
  EventBillRouter,
  EventPriceModelRouter,
  OrganizationBillingRouter,
  PriceModelRouter,
} from './billing.routes.js';

export class BillingModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PriceModelService).toSelf().inSingletonScope();
    options.bind(BillingService).toSelf().inSingletonScope();
    options.bind(BillingController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/price-models', new PriceModelRouter());
    router.useRouter('/bills', new EventBillRouter());
    router.useRouter(
      '/organizations/:organizationId',
      new OrganizationBillingRouter(),
    );
    router.useRouter(
      '/events/:eventId/price-model',
      new EventPriceModelRouter(),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
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
