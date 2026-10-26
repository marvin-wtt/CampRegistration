import type { Request } from 'express';
import { auth, guard } from '#middlewares/index';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#utils/bindController';
import { resolve } from '#core/ioc/container';
import { hasEventPermission } from '#app/event/event.guard';
import { PaymentService } from './payment.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentPublicController } from './payment-public.controller.js';
import { verifyPaymentToken } from './payment-link.js';

/**
 * Holder of the registration's payment link — a capability, deliberately
 * not a permission: it lets a participant without an account see and pay
 * their own balance, and nothing else.
 */
export const paymentLinkToken = (req: Request): boolean => {
  const registration = req.modelOrFail('registration');
  const token = req.query.token;

  return (
    typeof token === 'string' && verifyPaymentToken(registration.id, token)
  );
};

/** `/events/:eventId/payments` */
export class EventPaymentRouter extends ModuleRouter {
  protected registerBindings() {
    /* event is bound globally */
  }

  protected defineRoutes() {
    const paymentController = resolve(PaymentController);

    this.router.get(
      '/',
      auth(),
      guard(hasEventPermission('event.payments.view')),
      controller(paymentController, 'eventIndex'),
    );
    this.router.get(
      '/status',
      auth(),
      guard(hasEventPermission('event.edit')),
      controller(paymentController, 'status'),
    );
    this.router.post(
      '/request',
      auth(),
      guard(hasEventPermission('event.payments.create')),
      controller(paymentController, 'requestAll'),
    );
  }
}

/** `/events/:eventId/registrations/:registrationId` — `payments` (managers) and `payment` (participant). */
export class RegistrationPaymentRouter extends ModuleRouter {
  protected registerBindings() {
    const paymentService = resolve(PaymentService);
    this.bindModel('payment', (req, id) => {
      const registration = req.model('registration');
      if (!registration) {
        return null;
      }
      return paymentService.getPayment(registration.id, id);
    });
  }

  protected defineRoutes() {
    const paymentController = resolve(PaymentController);
    const publicController = resolve(PaymentPublicController);

    this.router.get(
      '/payments',
      auth(),
      guard(hasEventPermission('event.payments.view')),
      controller(paymentController, 'index'),
    );
    this.router.post(
      '/payments',
      auth(),
      guard(hasEventPermission('event.payments.create')),
      controller(paymentController, 'store'),
    );
    this.router.post(
      '/payments/request',
      auth(),
      guard(hasEventPermission('event.payments.create')),
      controller(paymentController, 'request'),
    );
    this.router.put(
      '/payments/amount-due',
      auth(),
      guard(hasEventPermission('event.payments.adjust')),
      controller(paymentController, 'updateAmountDue'),
    );
    this.router.delete(
      '/payments/:paymentId',
      auth(),
      guard(hasEventPermission('event.payments.create')),
      controller(paymentController, 'destroy'),
    );
    this.router.post(
      '/payments/:paymentId/refunds',
      auth(),
      guard(hasEventPermission('event.payments.refund')),
      controller(paymentController, 'refund'),
    );

    this.router.get(
      '/payment',
      guard(paymentLinkToken),
      controller(publicController, 'summary'),
    );
    this.router.post(
      '/payment/checkout',
      guard(paymentLinkToken),
      controller(publicController, 'checkout'),
    );
  }
}
