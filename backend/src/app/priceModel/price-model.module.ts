import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { PriceModelController } from './price-model.controller.js';
import { PriceModelService } from './price-model.service.js';
import {
  EventPriceModelRouter,
  OrganizationPriceModelRouter,
  PriceModelRouter,
} from './price-model.routes.js';

export class PriceModelModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PriceModelService).toSelf().inSingletonScope();
    options.bind(PriceModelController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/price-models', new PriceModelRouter());
    router.useRouter(
      '/organizations/:organizationId/price-model',
      new OrganizationPriceModelRouter(),
    );
    router.useRouter(
      '/events/:eventId/price-model',
      new EventPriceModelRouter(),
    );
  }
}
