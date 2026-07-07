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
    const camp = req.modelOrFail('camp');
    await req.validate(validator.index);

    const registrations: RegistrationWithBed[] =
      await this.registrationService.queryRegistrations(camp.id);

    res.resource(RegistrationResource.collection(registrations));
  }

  async store(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const {
      body: { data, locale: bodyLocale },
    } = await req.validate(validator.store(camp));

    const locale = bodyLocale ?? req.preferredLocale();

    const registration = await this.registrationService.createRegistration(
      camp,
      {
        data,
        locale,
      },
      req.sessionId,
    );

    // Notify participant
    if (registration.status === 'ACCEPTED') {
      await RegistrationConfirmedMessage.enqueueFor(camp, registration);
    } else if (registration.status === 'WAITLISTED') {
      await RegistrationWaitlistedMessage.enqueueFor(camp, registration);
    } else {
      await RegistrationSubmittedMessage.enqueueFor(camp, registration);
    }

    // Notify contact email
    await RegistrationNotifyMessage.enqueue({ camp, registration });

    void this.realtimeService.emit(
      camp.id,
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
    const camp = req.modelOrFail('camp');
    const previousRegistration = req.modelOrFail('registration');

    const updateData = {
      data,
      customData,
      customFiles,
      status,
    };

    const registration = await this.registrationService.updateRegistrationById(
      camp,
      previousRegistration.id,
      updateData,
      req.sessionId,
    );

    if (!suppressMessage) {
      if (
        data !== undefined &&
        !isDeepStrictEqual(previousRegistration.data, registration.data)
      ) {
        await RegistrationUpdatedMessage.enqueueFor(camp, registration);
      }

      if (
        previousRegistration.status === 'PENDING' &&
        registration.status === 'ACCEPTED'
      ) {
        await RegistrationConfirmedMessage.enqueueFor(camp, registration);
      }

      if (
        previousRegistration.status === 'WAITLISTED' &&
        registration.status === 'ACCEPTED'
      ) {
        await RegistrationAcceptedMessage.enqueueFor(camp, registration);
      }
    }

    void this.realtimeService.emit(
      camp.id,
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
    const camp = req.modelOrFail('camp');
    const registration = req.modelOrFail('registration');

    await this.registrationService.deleteRegistration(registration);

    if (!suppressMessage) {
      await RegistrationDeletedMessage.enqueueFor(camp, registration);
    }

    void this.realtimeService.emit(
      camp.id,
      'registration',
      registration.id,
      'deleted',
    );

    res.status(httpStatus.NO_CONTENT).send();
  }
}
