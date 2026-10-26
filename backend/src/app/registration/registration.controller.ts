import { assertPriceUnchanged } from './registration.price-check.js';
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
import type { Event, Registration } from '#generated/prisma/client.js';
import type { RegistrationCreatePaymentMeta } from '@camp-registration/common/entities';
import logger from '#core/logger';
import { describeError } from '#utils/errors';
import { PaymentService } from '#app/payment/payment.service';
import { PaymentRequestedMessage } from '#app/payment/messages/requested.mail';
import { paymentPageUrl } from '#app/payment/payment-link';
import type { EventWithRelations } from '#app/event/event.types';

export class RegistrationController extends BaseController {
  constructor(
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
    @inject(PaymentService)
    private readonly paymentService: PaymentService,
  ) {
    super();
  }

  /**
   * Emails the payment link once a registration that owes money is accepted.
   * Before a date-based timing's request date, the daily job asks later.
   * Returns whether it asked.
   */
  private async requestPaymentOnAcceptance(
    event: Event,
    registration: Registration,
  ): Promise<boolean> {
    if (!registration.amountDue || registration.paymentRequestedAt) {
      return false;
    }

    const settings = await this.paymentService.getSettings(event.id);
    if (
      !settings.enabled ||
      !this.paymentService.requestsOpen(settings, event)
    ) {
      return false;
    }

    await PaymentRequestedMessage.enqueueFor(event, registration);
    await this.paymentService.markRequested(registration);
    return true;
  }

  /**
   * A registration accepted on submit (automatic confirmation) is asked to
   * pay at once and gets a checkout to be redirected to. Never fails the
   * registration itself — the participant can still pay later through the
   * payment page, whose link the request mail carries.
   */
  private async paymentMetaForNewRegistration(
    event: EventWithRelations,
    registration: Registration,
  ): Promise<RegistrationCreatePaymentMeta | null> {
    if (!registration.amountDue) {
      return null;
    }

    const settings = await this.paymentService.getSettings(event.id);
    if (!settings.enabled) {
      return null;
    }

    const pageUrl = paymentPageUrl(event.id, registration.id);

    if (
      registration.status !== 'ACCEPTED' ||
      !(await this.requestPaymentOnAcceptance(event, registration))
    ) {
      return { checkoutUrl: null, pageUrl };
    }

    try {
      const { checkoutUrl } = await this.paymentService.startCheckout(event, {
        ...registration,
        // Just asked: the checkout must not record the request again.
        paymentRequestedAt: new Date(),
      });
      return { checkoutUrl, pageUrl };
    } catch (error) {
      logger.warn(
        `Could not open a checkout for registration ${registration.id}: ${describeError(error)}`,
      );
      return { checkoutUrl: null, pageUrl };
    }
  }

  show(req: Request, res: Response) {
    const registration = req.modelOrFail('registration');

    res.resource(new RegistrationResource(registration));
  }

  async index(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    await req.validate(validator.index);

    const registrations: RegistrationWithBed[] =
      await this.registrationService.queryRegistrations(event.id);

    res.resource(RegistrationResource.collection(registrations));
  }

  async store(req: Request, res: Response) {
    const event = req.modelOrFail('event');
    const {
      body: { data, locale, group, priceCheck },
    } = await req.validate(validator.store(event, req.preferredLocale()));

    // The check only refuses; the registration below is charged what the
    // server calculates, and `priceCheck` goes no further than this line.
    assertPriceUnchanged(
      this.registrationService.quoteAmount(event, { data, locale, group }),
      priceCheck,
    );

    const registration = await this.registrationService.createRegistration(
      event,
      {
        data,
        locale,
        group,
      },
      req.sessionId,
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

    const payment = await this.paymentMetaForNewRegistration(
      event,
      registration,
    );

    void this.realtimeService.emit(
      event.id,
      'registration',
      registration.id,
      'created',
    );

    const resource = new RegistrationResource(registration);
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

      if (
        previousRegistration.status !== 'ACCEPTED' &&
        registration.status === 'ACCEPTED'
      ) {
        await this.requestPaymentOnAcceptance(event, registration);
      }
    }

    void this.realtimeService.emit(
      event.id,
      'registration',
      registration.id,
      'updated',
    );

    res.resource(new RegistrationResource(registration));
  }

  async destroy(req: Request, res: Response) {
    const {
      query: { suppressMessage, reason, paymentSettlement },
    } = await req.validate(validator.destroy);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    await this.registrationService.deleteRegistration(
      registration,
      reason,
      paymentSettlement,
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

    res.status(httpStatus.NO_CONTENT).send();
  }
}
