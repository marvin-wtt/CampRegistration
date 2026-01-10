import httpStatus from 'http-status';
import registrationService from './registration.service.js';
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
  RegistrationUpdatedMessage,
  RegistrationWaitlistedMessage,
} from '#app/registration/registration.messages';
import { BaseController } from '#core/base/BaseController';

class RegistrationController extends BaseController {
  show(req: Request, res: Response) {
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
      void RegistrationWaitlistedMessage.enqueueFor(camp, registration);
    } else {
      void RegistrationConfirmedMessage.enqueueFor(camp, registration);
    }

    // Notify contact email
    RegistrationNotifyMessage.enqueue({ camp, registration });

    res
      .status(httpStatus.CREATED)
      .resource(new RegistrationResource(registration));
  }

  async update(req: Request, res: Response) {
    const {
      body: { data, customData, waitingList },
      params: { registrationId },
      query: { suppressMessage },
    } = await req.validate(validator.update);
    const camp = req.modelOrFail('camp');
    const previousRegistration = req.modelOrFail('registration');

    const updateData = {
      data,
      customData,
      waitingList,
    };

    const registration = await registrationService.updateRegistrationById(
      camp,
      registrationId,
      updateData,
    );

    if (!suppressMessage) {
      if (previousRegistration.data !== registration.data) {
        void RegistrationUpdatedMessage.enqueueFor(camp, registration);
      }

      if (previousRegistration.waitingList && !registration.waitingList) {
        void RegistrationAcceptedMessage.enqueueFor(camp, registration);
      }
    }

    res.resource(new RegistrationResource(registration));
  }

  async destroy(req: Request, res: Response) {
    const {
      query: { suppressMessage },
    } = await req.validate(validator.destroy);
    const camp = req.modelOrFail('camp');
    const registration = req.modelOrFail('registration');

    await registrationService.deleteRegistration(registration);

    if (!suppressMessage) {
      void RegistrationDeletedMessage.enqueueFor(camp, registration);
    }

    res.status(httpStatus.NO_CONTENT).send();
  }
}

export default new RegistrationController();
