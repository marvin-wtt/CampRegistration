import { inject, injectable } from 'inversify';
import { auth } from '#core/auth/auth.middleware';
import { guard } from '#core/guard';
import { ModuleRouter } from '#core/router/ModuleRouter';
import { controller } from '#core/router/bindController';
import { hasEventPermission } from '#app/event/event.guard';
import { PaymentService } from '#app/payment/payment.service';
import { PaymentController } from '#app/payment/payment.controller';

@injectable()
export class PaymentRouter extends ModuleRouter {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(PaymentController)
    private readonly paymentController: PaymentController,
  ) {
    super();
  }

  protected registerBindings() {
    // The fees projection, not the registration model: the treasurer holds
    // no registration permission (docs/payments.md, "Treasurer's view").
    this.bindModel('registrationFee', (req, id) => {
      const event = req.modelOrFail('event');
      return this.paymentService.getRegistrationFee(event, id);
    });
    this.bindModel('payment', (req, id) => {
      const event = req.modelOrFail('event');
      return this.paymentService.getPaymentById(event.id, id);
    });
  }

  protected defineRoutes() {
    const action = (name: keyof PaymentController) =>
      controller(this.paymentController, name);

    this.router.use(auth());

    this.router.get(
      '/registrations',
      guard(hasEventPermission('event.payments.view')),
      action('indexRegistrations'),
    );
    this.router.get(
      '/orphaned',
      guard(hasEventPermission('event.payments.view')),
      action('indexOrphaned'),
    );
    this.router.get(
      '/registrations/:registrationFeeId',
      guard(hasEventPermission('event.payments.view')),
      action('showRegistration'),
    );
    this.router.post(
      '/registrations/:registrationFeeId',
      guard(hasEventPermission('event.payments.create')),
      action('store'),
    );
    this.router.put(
      '/registrations/:registrationFeeId/amount-due',
      guard(hasEventPermission('event.payments.adjust')),
      action('updateAmountDue'),
    );
    this.router.patch(
      '/:paymentId',
      guard(hasEventPermission('event.payments.adjust')),
      action('update'),
    );
    this.router.delete(
      '/:paymentId',
      guard(hasEventPermission('event.payments.adjust')),
      action('destroy'),
    );
    this.router.post(
      '/:paymentId/refunds',
      guard(hasEventPermission('event.payments.refund')),
      action('refund'),
    );
    this.router.delete(
      '/:paymentId/refunds/:refundId',
      guard(hasEventPermission('event.payments.refund')),
      action('destroyRefund'),
    );
  }
}
