import { catchRequestAsync } from 'utils/catchAsync';
import httpStatus from 'http-status';
import { collection, resource } from 'core/resource';
import registrationService from './registration.service';
import registrationResource from './registration.resource';
import { routeModel } from 'utils/verifyModel';
import { requestLocale } from 'utils/requestLocale';
import { catchAndResolve } from 'utils/promiseUtils';
import { validateRequest } from 'core/validation/request';
import validator from './registration.validation';

const show = catchRequestAsync(async (req, res) => {
  const registration = routeModel(req.models.registration);

  res.json(resource(registrationResource(registration)));
});

const index = catchRequestAsync(async (req, res) => {
  const {
    params: { campId },
  } = await validateRequest(req, validator.index);

  const registrations = await registrationService.queryRegistrations(campId);
  const resources = registrations.map((value) => registrationResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const {
    body: { data, locale: bodyLocale },
  } = await validateRequest(req, validator.store);
  const camp = routeModel(req.models.camp);
  const locale = bodyLocale ?? requestLocale(req);

  const registration = await registrationService.createRegistration(camp, {
    data,
    locale,
  });

  // Notify participant
  if (registration.waitingList) {
    await catchAndResolve(
      registrationService.sendWaitingListConfirmation(camp, registration),
    );
  } else {
    await catchAndResolve(
      registrationService.sendRegistrationConfirmation(camp, registration),
    );
  }

  // Notify contact email
  await catchAndResolve(
    registrationService.sendRegistrationManagerNotification(camp, registration),
  );

  res
    .status(httpStatus.CREATED)
    .json(resource(registrationResource(registration)));
});

const update = catchRequestAsync(async (req, res) => {
  const {
    body: { data, waitingList },
    params: { registrationId },
  } = await validateRequest(req, validator.update);
  const camp = routeModel(req.models.camp);
  const previousRegistration = routeModel(req.models.registration);

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
      registrationService.sendRegistrationConfirmation(camp, registration),
    );
  }

  res.json(resource(registrationResource(registration)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const registration = routeModel(req.models.registration);

  await registrationService.deleteRegistration(camp, registration);

  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
