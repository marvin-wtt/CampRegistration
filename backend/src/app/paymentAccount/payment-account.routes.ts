import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { organizationMember } from '#app/organization/organization.guard';
import { PaymentAccountController } from './payment-account.controller.js';

/** `/organizations/:organizationId/payment-account` */
export class PaymentAccountRouter extends ModuleRouter {
  protected registerBindings() {
    /* organization is bound globally */
  }

  protected defineRoutes() {
    const accountController: PaymentAccountController = resolve(
      PaymentAccountController,
    );

    this.router.use(auth());

    this.router.get(
      '/',
      guard(organizationMember('organization.payments.view')),
      controller(accountController, 'show'),
    );
    this.router.get(
      '/providers',
      guard(organizationMember('organization.payments.view')),
      controller(accountController, 'providers'),
    );
    this.router.put(
      '/',
      guard(organizationMember('organization.payments.edit')),
      controller(accountController, 'connect'),
    );
    this.router.delete(
      '/',
      guard(organizationMember('organization.payments.edit')),
      controller(accountController, 'disconnect'),
    );
  }
}
