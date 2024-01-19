import { catchRequestAsync } from 'utils/catchAsync';
import httpStatus from 'http-status';
import { collection, resource } from 'resources/resource';
import { fileService, registrationService } from 'services';
import { registrationResource } from 'resources';
import { routeModel } from 'utils/verifyModel';
import { requestLocale } from 'utils/requestLocale';

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
    await registrationService.sendWaitingListConfirmation(camp, registration);
  } else {
    await registrationService.sendRegistrationConfirmation(camp, registration);
  }

  // Notify contact email
  await registrationService.sendRegistrationManagerNotification(
    camp,
    registration,
  );

  res
    .status(httpStatus.CREATED)
    .json(resource(registrationResource(registration)));
});

const update = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
  const previousRegistration = routeModel(req.models.registration);
  const { registrationId } = req.params;
  const data = req.body;

  const registration = await registrationService.updateRegistrationById(
    camp,
    registrationId,
    {
      data: data.data,
      waitingList: data.waitingList,
    },
  );

  if (previousRegistration.waitingList && !registration.waitingList) {
    await registrationService.sendRegistrationConfirmation(camp, registration);
  }

  res.json(resource(registrationResource(registration)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { registrationId } = req.params;
  await registrationService.deleteRegistrationById(registrationId);

  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
