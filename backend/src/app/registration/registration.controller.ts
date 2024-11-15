import { catchRequestAsync } from 'utils/catchAsync';
import httpStatus from 'http-status';
import { collection, resource } from 'app/resource';
import registrationService from './registration.service';
import registrationResource from './registration.resource';
import { routeModel } from 'utils/verifyModel';
import { requestLocale } from 'utils/requestLocale';
import { catchAndResolve } from 'utils/promiseUtils';
import eventStream from 'utils/eventStream';

const { handler: events, broadcast } = eventStream();

const show = catchRequestAsync(async (req, res) => {
  const registration = routeModel(req.models.registration);

  res.json(resource(registrationResource(registration)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const registrations = await registrationService.queryRegistrations(campId);
  const resources = registrations.map((value) => registrationResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const { data, locale: bodyLocale } = req.body;
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

  const response = resource(registrationResource(registration));

  res.status(httpStatus.CREATED).json(response);

  broadcast('create', response);
});

const update = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const previousRegistration = routeModel(req.models.registration);
  const { registrationId } = req.params;
  const { data, waitingList } = req.body;

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

  const response = resource(registrationResource(registration));

  res.json(response);

  broadcast('update', response);
});

const destroy = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const registration = routeModel(req.models.registration);

  await registrationService.deleteRegistration(camp, registration);

  broadcast('delete', registration.id);

  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
  events,
};
