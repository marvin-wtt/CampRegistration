import { catchRequestAsync } from "@/utils/catchAsync";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import { collection, resource } from "@/resources/resource";
import { fileService, registrationService } from "@/services";
import { registrationResource } from "@/resources";
import { routeModel } from "@/utils/verifyModel";

const show = catchRequestAsync(async (req, res) => {
  const registration = routeModel(req.models.registration);

  if (registration == null) {
    throw new ApiError(httpStatus.NOT_FOUND, "Registration does not exist");
  }

  res.json(resource(registrationResource(registration)));
});

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const registrations = await registrationService.queryRegistrations(campId);
  const resources = registrations.map((value) => registrationResource(value));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body;

  let registration = await registrationService.createRegistration(campId, data);

  // Store related files
  if (req.files) {
    await fileService.saveRegistrationFiles(registration.id, req.files);
    // Null safe operator for type safety. It should never be null as it was just inserted.
    registration =
      (await registrationService.getRegistrationById(
        campId,
        registration.id
      )) ?? registration;
  }

  res
    .status(httpStatus.CREATED)
    .json(resource(registrationResource(registration)));
});

const update = catchRequestAsync(async (req, res) => {
  const { registrationId } = req.params;
  const data = req.body;

  const registration = await registrationService.updateRegistrationById(
    registrationId,
    data
  );
  if (registration == null) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Update without response."
    );
  }

  if (req.files) {
    await fileService.saveRegistrationFiles(registration.id, req.files);
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
