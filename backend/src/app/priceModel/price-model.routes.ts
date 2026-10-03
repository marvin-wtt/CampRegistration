import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { PriceModelController } from './price-model.controller.js';
import { PriceModelService } from './price-model.service.js';
import { PriceModelOfferService } from './price-model-offer.service.js';
import { PriceModelOfferController } from './price-model-offer.controller.js';
import { organizationMember } from '#app/organization/organization.guard';

// Pricing is the platform's business: routes are system administrators only —
// the bare `guard()` — except reading the default model and answering an offer.

export class PriceModelRouter extends ModuleRouter {
  protected registerBindings() {
    const priceModelService = resolve(PriceModelService);
    this.bindModel('priceModel', (_req, id) =>
      priceModelService.getPriceModelById(id),
    );
  }

  protected defineRoutes() {
    const priceModelController = resolve(PriceModelController);

    // Anyone founding an organization agrees to the default model's prices,
    // so they have to be able to read them. Ahead of the admin-only `use`.
    this.router.get(
      '/default',
      auth(),
      controller(priceModelController, 'showDefault'),
    );

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

/**
 * Mounted at `/organizations/:organizationId/price-model-offers`. System
 * administrators make and withdraw offers; the organization's administrators
 * accept them.
 */
export class OrganizationPriceModelOfferRouter extends ModuleRouter {
  protected registerBindings() {
    // `organization` is bound by the organization module.
    const offerService = resolve(PriceModelOfferService);
    this.bindModel('priceModelOffer', (_req, id) =>
      offerService.getOfferById(id),
    );
  }

  protected defineRoutes() {
    const offerController = resolve(PriceModelOfferController);
    const answer = guard(organizationMember('organization.price_model.accept'));

    this.router.post(
      '/',
      auth(),
      guard(),
      controller(offerController, 'store'),
    );
    this.router.get(
      '/pending',
      auth(),
      guard(organizationMember('organization.events.create')),
      controller(offerController, 'showPending'),
    );
    this.router.delete(
      '/:priceModelOfferId',
      auth(),
      guard(),
      controller(offerController, 'withdraw'),
    );
    this.router.post(
      '/:priceModelOfferId/accept',
      auth(),
      answer,
      controller(offerController, 'accept'),
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
