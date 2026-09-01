import httpStatus from 'http-status';
import { RegistrationService } from './registration.service.js';
import {
  RegistrationResource,
  type RegistrationWithBed,
} from './registration.resource.js';
import validator from './registration.validation.js';
import { type Request, type Response } from 'express';
import {
  RegistrationAcceptedMessage,
  RegistrationConfirmedMessage,
  RegistrationDeletedMessage,
  RegistrationNotifyMessage,
  RegistrationSubmittedMessage,
  RegistrationUpdatedMessage,
  RegistrationWaitlistedMessage,
} from '#app/registration/registration.messages';
import { changesForRegistration } from '#app/registration/registration.changes';
import { BaseController } from '#core/base/BaseController';
import { RealtimeService } from '#core/realtime/RealtimeService';
import { inject } from 'inversify';
import { isDeepStrictEqual } from 'node:util';

export class RegistrationController extends BaseController {
  constructor(
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @inject(RealtimeService)
    private readonly realtimeService: RealtimeService,
  ) {
    super();
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
      body: { data, locale: bodyLocale },
    } = await req.validate(validator.store(event));

    const locale = bodyLocale ?? req.preferredLocale();

    const registration = await this.registrationService.createRegistration(
      event,
      {
        data,
        locale,
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

    void this.realtimeService.emit(
      event.id,
      'registration',
      registration.id,
      'created',
    );

    res
      .status(httpStatus.CREATED)
      .resource(new RegistrationResource(registration));
  }

  async update(req: Request, res: Response) {
    const {
      body: { data, customData, customFiles, status },
      query: { suppressMessage },
    } = await req.validate(validator.update);
    const event = req.modelOrFail('event');
    const previousRegistration = req.modelOrFail('registration');

    const updateData = {
      data,
      customData,
      customFiles,
      status,
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
      query: { suppressMessage },
    } = await req.validate(validator.destroy);
    const event = req.modelOrFail('event');
    const registration = req.modelOrFail('registration');

    await this.registrationService.deleteRegistration(registration);

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
