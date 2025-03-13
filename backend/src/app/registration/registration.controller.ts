import httpStatus from 'http-status';
import registrationService from './registration.service.js';
import {
  RegistrationResource,
  RegistrationWithBed,
} from './registration.resource.js';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from './registration.validation.js';
import { type Request, type Response } from 'express';
import registrationMessages from '#app/registration/registration.messages.js';

class RegistrationController {
  async show(req: Request, res: Response) {
    const registration = req.modelOrFail('registration');

    res.resource(new RegistrationResource(registration));
  }

  async index(req: Request, res: Response) {
    const {
      params: { campId },
    } = await req.validate(validator.index);

    const registrations: RegistrationWithBed[] =
      await registrationService.queryRegistrations(campId);

    res.resource(RegistrationResource.collection(registrations));
  }

  async store(req: Request, res: Response) {
    const {
      body: { data, locale: bodyLocale },
    } = await req.validate(validator.store);
    const camp = req.modelOrFail('camp');
    const locale = bodyLocale ?? req.preferredLocale();

    const registration = await registrationService.createRegistration(camp, {
      data,
      locale,
    });

    // Notify participant
    if (registration.waitingList) {
      await catchAndResolve(
        registrationMessages.sendRegistrationWaitlisted(camp, registration),
      );
    } else {
      await catchAndResolve(
        registrationMessages.sendRegistrationConfirmed(camp, registration),
      );
    }

    // Notify contact email
    await catchAndResolve(
      registrationMessages.notifyContactEmail(camp, registration),
    );

    res
      .status(httpStatus.CREATED)
      .resource(new RegistrationResource(registration));
  }

  async update(req: Request, res: Response) {
    const {
      body: { data, waitingList },
      params: { registrationId },
    } = await req.validate(validator.update);
    const camp = req.modelOrFail('camp');
    const previousRegistration = req.modelOrFail('registration');

    const registration = await registrationService.updateRegistrationById(
      camp,
      registrationId,
      {
        data,
        waitingList,
      },
    );

    if (previousRegistration.waitingList && !registration.waitingList) {
      await catchAndResolve(
        registrationMessages.sendRegistrationConfirmed(camp, registration),
      );
    }

    res.resource(new RegistrationResource(registration));
  }

  async destroy(req: Request, res: Response) {
    const camp = req.modelOrFail('camp');
    const registration = req.modelOrFail('registration');

    await registrationService.deleteRegistration(camp, registration);

    res.status(httpStatus.NO_CONTENT).send();
  }
}

export default new RegistrationController();
