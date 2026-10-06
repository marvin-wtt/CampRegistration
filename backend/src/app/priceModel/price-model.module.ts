import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { PriceModelController } from './price-model.controller.js';
import { PriceModelService } from './price-model.service.js';
import { PriceModelOfferService } from './price-model-offer.service.js';
import { PriceModelOfferController } from './price-model-offer.controller.js';
import {
  PriceModelLoweredMessage,
  PriceModelOfferedMessage,
} from './price-model.messages.js';
import {
  EventPriceModelRouter,
  OrganizationPriceModelOfferRouter,
  OrganizationPriceModelRouter,
  PriceModelRouter,
} from './price-model.routes.js';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import { MailableRegistry } from '#core/mail/mail.registry';
import { resolve } from '#core/ioc/container';
import type { JobScheduler } from '#core/scheduler/JobScheduler';

export class PriceModelModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PriceModelService).toSelf().inSingletonScope();
    options.bind(PriceModelOfferService).toSelf().inSingletonScope();
    options.bind(PriceModelController).toSelf().inSingletonScope();
    options.bind(PriceModelOfferController).toSelf().inSingletonScope();
  }

  configure() {
    const registry = resolve(MailableRegistry);
    registry.register(PriceModelOfferedMessage);
    registry.register(PriceModelLoweredMessage);
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/price-models', new PriceModelRouter());
    router.useRouter(
      '/organizations/:organizationId/price-model',
      new OrganizationPriceModelRouter(),
    );
    router.useRouter(
      '/organizations/:organizationId/price-model-offers',
      new OrganizationPriceModelOfferRouter(),
    );
    router.useRouter(
      '/events/:eventId/price-model',
      new EventPriceModelRouter(),
    );
  }

  registerJobs(scheduler: JobScheduler): void {
    // Offers take effect at midnight in the billing time zone.
    scheduler.schedule('price-model-apply-offers', '*/15 * * * *', () =>
      resolve(PriceModelOfferService).applyDueOffers(),
    );
  }

  registerPermissions(): ScopedPermissions {
    return {
      organization: {
        ADMIN: ['organization.price_model.accept'],
      },
    };
  }
}
