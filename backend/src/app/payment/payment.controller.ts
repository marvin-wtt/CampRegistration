import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import ApiError from '#core/router/ApiError';
import { PaymentService } from './payment.service.js';
import { PaymentNotifier } from './payment.notifier.js';
import { PaymentResource } from './payment.resource.js';
import { PaymentCollectionService } from './payment-collection.service.js';
import { PaymentRefundService } from './payment-refund.service.js';
import { PaymentRefundedMessage } from './messages/refunded.mail.js';
import validator from './payment.validation.js';
import { paymentPageUrl } from './payment-link.js';
import { PaymentAccountService } from '#app/paymentAccount/payment-account.service';
import { RealtimeService } from '#core/realtime/RealtimeService';
import type {
  EventPaymentStatus,
  PaymentRequestResult,
  PaymentProviderName,
  RegistrationPaymentLink,
} from '@camp-registration/common/entities';

export class PaymentController extends BaseController {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(PaymentNotifier) private readonly notifier: PaymentNotifier,
    @inject(PaymentAccountService)
    private readonly accountService: PaymentAccountService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
    @inject(PaymentCollectionService)
    private readonly collection: PaymentCollectionService,
    @inject(PaymentRefundService)
    private readonly refundService: PaymentRefundService,
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
        unrequested: (await this.collection.findUnrequested(event)).length,
        currencyLocked: await this.paymentService.isCurrencyLocked(event.id),
      } satisfies EventPaymentStatus,
    });
  }

  async index(req: Request, res: Response) {
    await req.validate(validator.index);
    const registration = req.modelOrFail('registration');

    const payments = await this.paymentService.queryRegistrationPayments(
      registration.id,
    );

    res.resource(PaymentResource.collection(payments));
  }

  /** The participant's payment link, for managers to pass on by other means. */
  async link(req: Request, res: Response) {
    await req.validate(validator.index);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    res.json({
      data: {
        pageUrl: registration.amountDue
          ? paymentPageUrl(event.id, registration.id)
          : null,
      } satisfies RegistrationPaymentLink,
    });
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
    const result = await this.refundService.refund(
      payment,
      {
        amount: body.amount,
        reason: body.reason ?? null,
        notifyParticipant,
        outsideApp: body.outsideApp ?? false,
        reduceAmountDue: body.reduceAmountDue ?? false,
      },
      req.authUserId(),
    );

    // Otherwise the provider's confirmation (reconciled from the webhook) notifies.
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

  /**
   * Fixes what a registration owes, or with `amount: null` resets it to the
   * quote — what the registration form showed.
   */
  async updateAmountDue(req: Request, res: Response) {
    const { body } = await req.validate(validator.updateAmountDue);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    if (body.amount === null && registration.quotedAmount === null) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This registration predates quoted amounts; set the amount instead',
        { code: 'PAYMENT_NO_QUOTE' },
      );
    }
    const amountDue = body.amount ?? registration.quotedAmount;

    await this.paymentService.setAmountDue(event, registration, {
      amountDue,
      adjusted: body.amount !== null,
      note: body.note ?? null,
    });

    void this.realtimeService.emit(
      event.id,
      'registration',
      registration.id,
      'updated',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }

  /**
   * Asks every accepted registration that owes money and was never asked —
   * e.g. after payments were turned on with registrations already in.
   */
  async requestAll(req: Request, res: Response) {
    await req.validate(validator.eventIndex);
    const event = req.modelOrFail('event');

    const requested = await this.collection.requestAll(event);

    res.json({
      data: { requested } satisfies PaymentRequestResult,
    });
  }

  /** Re-sends the payment request mail, with the participant's payment link. */
  async request(req: Request, res: Response) {
    await req.validate(validator.request);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    await this.collection.request(event, registration);

    res.status(httpStatus.NO_CONTENT).send();
  }
}
