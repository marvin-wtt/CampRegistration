import httpStatus from 'http-status';
import { collection, resource } from '#core/resource';
import registrationService from './registration.service.js';
import registrationResource from './registration.resource.js';
import { catchAndResolve } from '#utils/promiseUtils';
import validator from './registration.validation.js';
import { type Request, type Response } from 'express';
import registrationMessages from '#app/registration/registration.messages.js';

const show = async (req: Request, res: Response) => {
  const registration = req.modelOrFail('registration');

  res.json(resource(registrationResource(registration)));
};

const index = async (req: Request, res: Response) => {
  const {
    params: { campId },
  } = await req.validate(validator.index);

  const registrations = await registrationService.queryRegistrations(campId);
  const resources = registrations.map((value) => registrationResource(value));

  res.json(collection(resources));
};

const store = async (req: Request, res: Response) => {
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
      registrationMessages.sendWaitingListNotification(camp, registration),
    );
  } else {
    await catchAndResolve(
      registrationMessages.sendRegistrationConfirmation(camp, registration),
    );
  }

  // Notify contact email
  await catchAndResolve(
    registrationMessages.notifyContactEmail(camp, registration),
  );

  res
    .status(httpStatus.CREATED)
    .json(resource(registrationResource(registration)));
};

const update = async (req: Request, res: Response) => {
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
      registrationMessages.sendRegistrationConfirmation(camp, registration),
    );
  }

  res.json(resource(registrationResource(registration)));
};

const destroy = async (req: Request, res: Response) => {
  const camp = req.modelOrFail('camp');
  const registration = req.modelOrFail('registration');

  await registrationService.deleteRegistration(camp, registration);

  res.status(httpStatus.NO_CONTENT).send();
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};
