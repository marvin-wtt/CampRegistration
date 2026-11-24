import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import ApiError from '#core/router/ApiError';
import { PaymentService } from '#app/payment/payment.service';
import {
  PaymentResource,
  RegistrationFeeResource,
} from '#app/payment/payment.resource';
import validator from '#app/payment/payment.validation';

@injectable()
export class PaymentController extends BaseController {
  constructor(
    @inject(PaymentService) private readonly paymentService: PaymentService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
  }

  async indexRegistrations(req: Request, res: Response) {
    await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const fees = await this.paymentService.queryRegistrationFees(event);

    res.resource(RegistrationFeeResource.collection(fees));
  }

  async indexOrphaned(req: Request, res: Response) {
    await req.validate(validator.index);
    const event = req.modelOrFail('event');

    const payments = await this.paymentService.queryOrphanedPayments(event.id);

    res.resource(PaymentResource.collection(payments));
  }

  async showRegistration(req: Request, res: Response) {
    await req.validate(validator.showRegistration);

    res.resource(
      new RegistrationFeeResource(req.modelOrFail('registrationFee')),
    );
  }

  async store(req: Request, res: Response) {
    const { body } = await req.validate(validator.store);
    const fee = req.modelOrFail('registrationFee');

    await this.paymentService.recordPayment(fee, body, req.authUserId());

    await this.respondWithFee(
      req,
      res,
      fee.registration.id,
      httpStatus.CREATED,
    );
  }

  async updateAmountDue(req: Request, res: Response) {
    const { body } = await req.validate(validator.updateAmountDue);
    const fee = req.modelOrFail('registrationFee');

    await this.paymentService.setAmountDue(fee.registration, body);

    await this.respondWithFee(req, res, fee.registration.id);
  }

  async update(req: Request, res: Response) {
    const { body } = await req.validate(validator.update);
    const payment = req.modelOrFail('payment');

    const updated = await this.paymentService.updatePayment(payment, body);

    this.emit(updated.eventId, updated.registrationId);
    res.resource(new PaymentResource(updated));
  }

  async destroy(req: Request, res: Response) {
    await req.validate(validator.destroy);
    const payment = req.modelOrFail('payment');

    await this.paymentService.deletePayment(payment);

    this.emit(payment.eventId, payment.registrationId);
    res.status(httpStatus.NO_CONTENT).send();
  }

  async refund(req: Request, res: Response) {
    const { body } = await req.validate(validator.refund);
    const payment = req.modelOrFail('payment');

    const updated = await this.paymentService.refundPayment(
      payment,
      body,
      req.authUserId(),
    );

    this.emit(updated.eventId, updated.registrationId);
    res.status(httpStatus.CREATED).resource(new PaymentResource(updated));
  }

  async destroyRefund(req: Request, res: Response) {
    const {
      params: { refundId },
    } = await req.validate(validator.destroyRefund);
    const payment = req.modelOrFail('payment');

    const updated = await this.paymentService.deleteRefund(payment, refundId);

    this.emit(updated.eventId, updated.registrationId);
    res.resource(new PaymentResource(updated));
  }

  /** The registration's fee as it is now, after a write to it. */
  private async respondWithFee(
    req: Request,
    res: Response,
    registrationId: string,
    status: number = httpStatus.OK,
  ) {
    const event = req.modelOrFail('event');
    const fee = await this.paymentService.getRegistrationFee(
      event,
      registrationId,
    );
    if (!fee) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Registration not found');
    }

    this.emit(event.id, registrationId);
    res.status(status).resource(new RegistrationFeeResource(fee));
  }

  /** Payments of deleted registrations change the whole list. */
  private emit(eventId: string, registrationId: string | null) {
    if (registrationId) {
      void this.realtimeService.emit(
        eventId,
        'registration_fee',
        registrationId,
        'updated',
      );
    } else {
      void this.realtimeService.emitInvalidation(eventId, 'registration_fee');
    }
  }
}
