import type { Request, Response } from 'express';
import { inject } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { PaymentService } from './payment.service.js';
import { PaymentNotifier } from './payment.notifier.js';
import validator from './payment.validation.js';

/**
 * The participant's side, authenticated by the payment link token rather
 * than a login (see `paymentLinkToken`).
 */
export class PaymentPublicController extends BaseController {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(PaymentNotifier) private readonly notifier: PaymentNotifier,
  ) {
    super();
  }

  async summary(req: Request, res: Response) {
    await req.validate(validator.summary);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    // The participant just came back from checkout (or is waiting on the
    // page): reconcile now instead of waiting for the webhook, which may be
    // late — or, on a local dev server, never arrive.
    await this.notifier.notify(
      await this.paymentService.syncLatestOpen(registration.id),
    );

    const summary = await this.paymentService.getSummary(event, registration);

    res.json({ data: summary });
  }

  async checkout(req: Request, res: Response) {
    await req.validate(validator.checkout);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    const { checkoutUrl, payment } = await this.paymentService.startCheckout(
      event,
      registration,
    );

    this.notifier.emit(event.id, payment.id, null, 'created');

    res.json({ data: { checkoutUrl } });
  }
}
