import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { organizationMember } from '#app/organization/organization.guard';
import { hasEventPermission } from '#app/event/event.guard';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';

// Bills are the platform's business: everything here except an organization
// or event reading its own billing is system administrators only — the bare
// `guard()`.

export class EventBillRouter extends ModuleRouter {
  protected registerBindings() {
    const billingService = resolve(BillingService);
    this.bindModel('eventBill', (_req, id) => billingService.getBillById(id));
  }

  protected defineRoutes() {
    const billingController = resolve(BillingController);

    this.router.use(auth(), guard());

    this.router.get('/', controller(billingController, 'index'));
    this.router.post('/', controller(billingController, 'store'));
    this.router.patch('/:eventBillId', controller(billingController, 'update'));
  }
}

/** Mounted at `/organizations/:organizationId/billing`. */
export class OrganizationBillingRouter extends ModuleRouter {
  protected registerBindings() {
    // `organization` is bound by the organization module.
  }

  protected defineRoutes() {
    const billingController = resolve(BillingController);

    this.router.get(
      '/',
      auth(),
      guard(organizationMember('organization.billing.view')),
      controller(billingController, 'organization'),
    );
  }
}

/** Mounted at `/events/:eventId/billing`. */
export class EventBillingRouter extends ModuleRouter {
  protected registerBindings() {
    // `event` is bound globally.
  }

  protected defineRoutes() {
    const billingController = resolve(BillingController);

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.billing.view')),
      controller(billingController, 'event'),
    );
  }
}
