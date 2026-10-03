import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { PriceModelController } from './price-model.controller.js';
import { PriceModelService } from './price-model.service.js';

// Pricing is the platform's business: every route here is system
// administrators only — the bare `guard()`.

export class PriceModelRouter extends ModuleRouter {
  protected registerBindings() {
    const priceModelService = resolve(PriceModelService);
    this.bindModel('priceModel', (_req, id) =>
      priceModelService.getPriceModelById(id),
    );
  }

  protected defineRoutes() {
    const priceModelController = resolve(PriceModelController);

    this.router.use(auth(), guard());

    this.router.get('/', controller(priceModelController, 'index'));
    this.router.post('/', controller(priceModelController, 'store'));
    this.router.patch(
      '/:priceModelId',
      controller(priceModelController, 'update'),
    );
    this.router.delete(
      '/:priceModelId',
      controller(priceModelController, 'destroy'),
    );
    this.router.put(
      '/:priceModelId/default',
      controller(priceModelController, 'makeDefault'),
    );
  }
}

/** Mounted at `/organizations/:organizationId/price-model`. */
export class OrganizationPriceModelRouter extends ModuleRouter {
  protected registerBindings() {
    // `organization` is bound by the organization module.
  }

  protected defineRoutes() {
    const priceModelController = resolve(PriceModelController);

    this.router.put(
      '/',
      auth(),
      guard(),
      controller(priceModelController, 'assignToOrganization'),
    );
  }
}

/** Mounted at `/events/:eventId/price-model`. */
export class EventPriceModelRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` is bound by the event module.
  }

  protected defineRoutes() {
    const priceModelController = resolve(PriceModelController);

    this.router.put(
      '/',
      auth(),
      guard(),
      controller(priceModelController, 'assignToEvent'),
    );
  }
}
