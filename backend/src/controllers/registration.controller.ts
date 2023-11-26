import { catchRequestAsync } from "@/utils/catchAsync";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import { collection, resource } from "@/resources/resource";
import { fileService, registrationService } from "@/services";
import { registrationResource } from "@/resources";
import { routeModel } from "@/utils/verifyModel";
import { requestLocale } from "@/utils/requestLocale";

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
  const camp = routeModel(req.models.camp);
  const locale = requestLocale(req);
  const { data } = req.body;
  const files = req.files;

  let registration = await registrationService.createRegistration(camp, {
    data,
    locale,
  });

  // Store related files
  // Uploaded files for this request may only be in req.files
  if (files) {
    registration = await fileService.saveRegistrationFiles(
      registration.id,
      files,
    );
  }

  // TODO Send notification to participant
  // TODO Send notifications to contact email(s)

  res
    .status(httpStatus.CREATED)
    .json(resource(registrationResource(registration)));
});

const update = catchRequestAsync(async (req, res) => {
  const camp = routeModel(req.models.camp);
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
  if (registration == null) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Update without response.",
    );
  }

  if (req.files) {
    await fileService.saveRegistrationFiles(registration.id, req.files);
  }

  // TODO Send notification to participant

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
