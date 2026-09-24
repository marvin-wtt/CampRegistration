import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import ApiError from '#utils/ApiError';
import { PaymentService } from './payment.service.js';
import { PaymentNotifier } from './payment.notifier.js';
import { PaymentResource } from './payment.resource.js';
import { PaymentRequestedMessage } from './messages/requested.mail.js';
import { PaymentRefundedMessage } from './messages/refunded.mail.js';
import validator from './payment.validation.js';
import { paymentPageUrl } from './payment-link.js';
import { PaymentAccountService } from './payment-account.service.js';
import type {
  EventPaymentStatus,
  PaymentProviderName,
} from '@camp-registration/common/entities';

export class PaymentController extends BaseController {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(PaymentNotifier) private readonly notifier: PaymentNotifier,
    @inject(PaymentAccountService)
    private readonly accountService: PaymentAccountService,
  ) {
    super();
  }

  async eventIndex(req: Request, res: Response) {
    await req.validate(validator.eventIndex);
    const event = req.modelOrFail('event');

    const payments = await this.paymentService.queryEventPayments(event.id);

    res.resource(PaymentResource.collection(payments));
  }

  /** Whether online payments can work for this event, for its settings page. */
  async status(req: Request, res: Response) {
    await req.validate(validator.eventIndex);
    const event = req.modelOrFail('event');

    const account = await this.accountService.getByOrganization(
      event.organizationId,
    );

    res.json({
      data: {
        account: account
          ? {
              provider: account.provider as PaymentProviderName,
              mode: account.mode === 'live' ? 'live' : 'test',
            }
          : null,
        organizationVerified:
          event.organization.verificationStatus === 'VERIFIED',
      } satisfies EventPaymentStatus,
    });
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const registration = req.modelOrFail('registration');

    const payments = await this.paymentService.queryRegistrationPayments(
      registration.id,
    );

    // The participant's payment link, for managers to pass on by other means.
    res.resource(
      PaymentResource.collection(payments, {
        pageUrl: registration.amountDue
          ? paymentPageUrl(req.modelOrFail('event').id, registration.id)
          : null,
      }),
    );
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    const payment = await this.paymentService.createManualPayment(
      event,
      registration,
      {
        amount: body.amount,
        paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
        method: body.method,
        note: body.note,
      },
      req.authUserId(),
    );

    this.notifier.emit(event.id, payment.id, registration.id, 'created');

    res.status(httpStatus.CREATED).resource(new PaymentResource(payment));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const event = req.modelOrFail('event');
    const payment = req.modelOrFail('payment');

    await this.paymentService.deleteManualPayment(payment);

    this.notifier.emit(event.id, payment.id, payment.registrationId, 'deleted');

    res.status(httpStatus.NO_CONTENT).send();
  }

  async refund(req: Request, res: Response) {
    const { body } = await req.validate(validator.refund);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');
    const payment = req.modelOrFail('payment');

    const notifyParticipant = !body.suppressMessage;
    const result = await this.paymentService.refund(
      event,
      payment.id,
      {
        amount: body.amount,
        reason: body.reason ?? null,
        notifyParticipant,
      },
      req.authUserId(),
    );

    // Otherwise the provider's confirmation (webhook sync) notifies.
    if (result.completedNow && notifyParticipant) {
      await PaymentRefundedMessage.enqueueForRefund(
        event,
        registration,
        result.refund,
      );
    }

    this.notifier.emit(event.id, payment.id, registration.id);

    res
      .status(httpStatus.CREATED)
      .resource(new PaymentResource(result.payment));
  }

  /** Re-sends the payment request mail, with the participant's payment link. */
  async request(req: Request, res: Response) {
    await req.validate(validator.request);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    if (!registration.amountDue) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration does not owe a payment',
        { code: 'PAYMENT_NOTHING_DUE' },
      );
    }

    await PaymentRequestedMessage.enqueueFor(event, registration);
    await this.paymentService.markRequested(registration.id);

    res.status(httpStatus.NO_CONTENT).send();
  }
}
