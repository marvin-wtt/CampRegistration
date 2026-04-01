import httpStatus from 'http-status';
import { RegistrationService } from './registration.service.js';
import {
  RegistrationResource,
  type RegistrationWithBed,
} from './registration.resource.js';
import { RegistrationLogResource } from './registration-log.resource.js';
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
import { inject } from 'inversify';
import { RegistrationLogService } from '#app/registration/registration-log.service';

export class RegistrationController extends BaseController {
  constructor(
    @inject(RegistrationService)
    private readonly registrationService: RegistrationService = registrationService,
    @inject(RegistrationLogService)
    private readonly registrationLogService: RegistrationLogService,
  ) {
    super();
  }

  show(req: Request, res: Response) {
    const registration = req.modelOrFail('registration');

    res.resource(new RegistrationResource(registration));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const registrations: RegistrationWithBed[] =
      await this.registrationService.queryRegistrations(campId);

    res.resource(RegistrationResource.collection(registrations));
  }

  async store(req: Request, res: Response) {
    const {
      body: { data, locale: bodyLocale },
    } = await req.validate(validator.store);
    // !! USE CAUTION, THE DATA IS NOT VALIDATED HERE !!

    const camp = req.modelOrFail('camp');
    const locale = bodyLocale ?? req.preferredLocale();

    const registration = await this.registrationService.createRegistration(
      camp,
      {
        data,
        locale,
      },
      req.sessionId,
      null,
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

    res
      .status(httpStatus.CREATED)
      .resource(new RegistrationResource(registration));
  }

  async update(req: Request, res: Response) {
    const {
      body: { data, customData, status, note },
      params: { registrationId },
      query: { suppressMessage },
    } = await req.validate(validator.update);
    const camp = req.modelOrFail('camp');
    const previousRegistration = req.modelOrFail('registration');
    const userId = req.authUserId();

    const updateData = {
      data,
      customData,
      status,
    };

    const registration = await this.registrationService.updateRegistrationById(
      camp,
      registrationId,
      updateData,
      req.sessionId,
      userId,
      note,
    );

    if (!suppressMessage) {
      if (previousRegistration.data !== registration.data) {
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

    res.resource(new RegistrationResource(registration));
  }

  async destroy(req: Request, res: Response) {
    const {
      body: { note },
      query: { suppressMessage },
    } = await req.validate(validator.destroy);
    const camp = req.modelOrFail('camp');
    const registration = req.modelOrFail('registration');
    const userId = req.authUserId();

    await this.registrationService.deleteRegistration(registration, userId, note);

    if (!suppressMessage) {
      await RegistrationDeletedMessage.enqueueFor(camp, registration);
    }

    res.status(httpStatus.NO_CONTENT).send();
  }

  async logs(req: Request, res: Response) {
    const {
      params: { campId, registrationId },
    } = await req.validate(validator.logs);

    const logEntries = await this.registrationLogService.getLogsByRegistrationId(
      campId,
      registrationId,
    );

    res.resource(RegistrationLogResource.collection(logEntries));
  }
}
