import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { organizationMember } from '#app/organization/organization.guard';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { PriceModelService } from './price-model.service.js';

// Pricing and bills are the platform's business: everything here except an
// organization reading its own billing is system administrators only — the
// bare `guard()`.

export class PriceModelRouter extends ModuleRouter {
  protected registerBindings() {
    const priceModelService = resolve(PriceModelService);
    this.bindModel('priceModel', (_req, id) =>
      priceModelService.getPriceModelById(id),
    );
  }

  protected defineRoutes() {
    const billingController = resolve(BillingController);

    this.router.use(auth(), guard());

    this.router.get('/', controller(billingController, 'priceModelIndex'));
    this.router.post('/', controller(billingController, 'priceModelStore'));
    this.router.patch(
      '/:priceModelId',
      controller(billingController, 'priceModelUpdate'),
    );
    this.router.delete(
      '/:priceModelId',
      controller(billingController, 'priceModelDestroy'),
    );
    this.router.put(
      '/:priceModelId/default',
      controller(billingController, 'priceModelDefault'),
    );
  }
}

export class EventBillRouter extends ModuleRouter {
  protected registerBindings() {
    const billingService = resolve(BillingService);
    this.bindModel('eventBill', (_req, id) => billingService.getBillById(id));
  }

  protected defineRoutes() {
    const billingController = resolve(BillingController);

    this.router.use(auth(), guard());

    this.router.get('/', controller(billingController, 'billIndex'));
    this.router.post('/', controller(billingController, 'billStore'));
    this.router.patch(
      '/:eventBillId',
      controller(billingController, 'billUpdate'),
    );
  }
}

/** Mounted at `/organizations/:organizationId`, beside the organization's own routes. */
export class OrganizationBillingRouter extends ModuleRouter {
  protected registerBindings() {
    // `organization` is bound by the organization module.
  }

  protected defineRoutes() {
    const billingController = resolve(BillingController);

    this.router.get(
      '/billing',
      auth(),
      guard(organizationMember('organization.billing.view')),
      controller(billingController, 'organizationBilling'),
    );
    this.router.put(
      '/price-model',
      auth(),
      guard(),
      controller(billingController, 'organizationPriceModel'),
    );
  }
}

/** Mounted at `/events/:eventId/price-model`. */
export class EventPriceModelRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` is bound by the event module.
  }

  protected defineRoutes() {
    const billingController = resolve(BillingController);

    this.router.put(
      '/',
      auth(),
      guard(),
      controller(billingController, 'eventPriceModel'),
    );
  }
}
