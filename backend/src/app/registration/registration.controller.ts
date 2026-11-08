import httpStatus from 'http-status';
import { RegistrationService } from './registration.service.js';
import {
  RegistrationResource,
  type RegistrationWithBed,
} from './registration.resource.js';
import validator from './registration.validation.js';
import { type Request, type Response } from 'express';
import { RegistrationNotifyMessage } from '#app/registration/messages/notify.mail';
import { RegistrationAcceptedMessage } from '#app/registration/messages/accepted.mail';
import { RegistrationConfirmedMessage } from '#app/registration/messages/confirmed.mail';
import { RegistrationDeletedMessage } from '#app/registration/messages/deleted.mail';
import { RegistrationSubmittedMessage } from '#app/registration/messages/submitted.mail';
import { RegistrationUpdatedMessage } from '#app/registration/messages/updated.mail';
import { RegistrationWaitlistedMessage } from '#app/registration/messages/waitlisted.mail';
import { changesForRegistration } from '#app/registration/registration.changes';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject } from 'inversify';
import { isDeepStrictEqual } from 'node:util';
import type { Registration } from '#generated/prisma/client.js';
import {
  RegistrationPayments,
  type RegistrationWithPayments,
} from '#app/payment/registration-payments';
import { hasEventPermission } from '#app/event/event.guard';
import { passes } from '#core/guard';

export class RegistrationController extends BaseController {
  constructor(
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
    @inject(RegistrationPayments)
    private readonly payments: RegistrationPayments,
  ) {
    super();
  }

  /** Whether the requester may see payment data. */
  private paymentsVisible(req: Request): Promise<boolean> {
    return passes(req, hasEventPermission('event.payments.view'));
  }

  /** Adds each registration's balance, `null` without payment access. */
  private async withPayments<T extends RegistrationWithPayments>(
    req: Request,
    registrations: T[],
  ): Promise<(T & Pick<RegistrationWithBed, 'payment'>)[]> {
    const visible = await this.paymentsVisible(req);

    return registrations.map((registration) => ({
      ...registration,
      payment: this.payments.present(registration, visible),
    }));
  }

  private async resourceFor(req: Request, registration: Registration) {
    const visible = await this.paymentsVisible(req);

    return new RegistrationResource({
      ...registration,
      payment: this.payments.present(registration, visible),
    });
  }

  async show(req: Request, res: Response) {
    const registration = req.modelOrFail('registration');

    res.resource(await this.resourceFor(req, registration));
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const registrations: RegistrationWithBed[] =
      await this.registrationService.queryRegistrations(event.id);

    res.resource(
      RegistrationResource.collection(
        await this.withPayments(req, registrations),
      ),
    );
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { data, locale, group, priceCheck },
    } = await req.validate(validator.store(event, req.preferredLocale()));

    const registration = await this.registrationService.createRegistration(
      event,
      { data, locale, group },
      req.sessionId,
      priceCheck,
    );

    // Notify participant
    if (registration.status === 'ACCEPTED') {
      await RegistrationConfirmedMessage.enqueueFor(event, registration);
    } else if (registration.status === 'WAITLISTED') {
      await RegistrationWaitlistedMessage.enqueueFor(event, registration);
    } else {
      await RegistrationSubmittedMessage.enqueueFor(event, registration);
    }

    // Notify contact email
    await RegistrationNotifyMessage.enqueue({ event, registration });

    const payment = await this.payments.created(event, registration);

    void this.realtimeService.emit(
      event.id,
      'registration',
      registration.id,
      'created',
    );

    const resource = await this.resourceFor(req, registration);
    if (payment) {
      resource.withMeta({ payment });
    }

    res.status(httpStatus.CREATED).resource(resource);
  }

  async update(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { data, customData, customFiles, status, group },
      query: { suppressMessage },
    } = await req.validate(validator.update(event));
    const previousRegistration = req.modelOrFail('registration');

    const updateData = {
      data,
      customData,
      customFiles,
      status,
      group,
    };

    const registration = await this.registrationService.updateRegistrationById(
      event,
      previousRegistration.id,
      updateData,
      req.sessionId,
    );

    if (!suppressMessage) {
      if (
        data !== undefined &&
        !isDeepStrictEqual(previousRegistration.data, registration.data)
      ) {
        await RegistrationUpdatedMessage.enqueueFor(
          event,
          registration,
          changesForRegistration(event, previousRegistration, registration),
        );
      }

      if (
        previousRegistration.status === 'PENDING' &&
        registration.status === 'ACCEPTED'
      ) {
        await RegistrationConfirmedMessage.enqueueFor(event, registration);
      }

      if (
        previousRegistration.status === 'WAITLISTED' &&
        registration.status === 'ACCEPTED'
      ) {
        await RegistrationAcceptedMessage.enqueueFor(event, registration);
      }
    }

    await this.payments.statusChanged(
      event,
      previousRegistration.status,
      registration,
      { notify: !suppressMessage },
    );

    void this.realtimeService.emit(
      event.id,
      'registration',
      registration.id,
      'updated',
    );

    res.resource(await this.resourceFor(req, registration));
  }

  async destroy(req: Request, res: Response) {
    const {
      query: { suppressMessage, reason, paymentSettlement },
    } = await req.validate(validator.destroy);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    await this.registrationService.deleteRegistration(
      event,
      registration,
      reason,
      paymentSettlement,
      {
        userId: req.authUserId(),
        maySettle: await passes(
          req,
          hasEventPermission('event.payments.refund'),
        ),
      },
    );

    if (!suppressMessage) {
      await RegistrationDeletedMessage.enqueueFor(event, registration);
    }

    void this.realtimeService.emit(
      event.id,
      'registration',
      registration.id,
      'deleted',
    );
    // Its payments stay, without the registration.
    void this.realtimeService.emitInvalidation(event.id, 'payment');

    res.status(httpStatus.NO_CONTENT).send();
  }
}
