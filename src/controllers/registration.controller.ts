import { Controller } from "./controller";
import catchAsync from "../utils/catchAsync";
import { SurveyModel } from "survey-core";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { collection, resource } from "../resources/resource";
import { registrationService } from "../services";
import { registrationResource } from "../resources";
import {Prisma} from "@prisma/client";

const show = catchAsync(async (req, res) => {
  const { registrationId } = req.params;
  const registration = await registrationService.getRegistrationById(
    registrationId
  );

  if (registration == null) {
    throw new ApiError(httpStatus.NOT_FOUND, "Registration does not exist");
  }

  res.json(resource(registrationResource(registration)));
});

const index = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const registrations = await registrationService.queryRegistrations(campId);
  const resources = registrations.map((value) => registrationResource(value));

  res.json(collection(resources));
});

const store = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const data = req.body as Prisma.RegistrationCreateInput;

  // TODO Data not validated

  const registration = await registrationService.createRegistration(campId, data);
  res.status(httpStatus.CREATED).json(resource(registrationResource(registration)));
});

const update = catchAsync(async (req, res) => {
  const { campId, registrationId } = req.params;
  const data = req.body as Prisma.RegistrationUpdateInput;

  // TODO Data not validated - but should it be?

  const registration = await registrationService.updateRegistrationById(registrationId, data);
  if (registration == null) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Update without response.")
  }
  res.json(resource(registrationResource(registration)));
});

const destroy = catchAsync(async (req, res) => {
  const { campId, registrationId } = req.params;
  await registrationService.deleteRegistrationById(registrationId);
  res.status(httpStatus.NO_CONTENT).send();
});

const validateSurvey = (surveyJson: object, dataJson: object): boolean => {
  const survey = new SurveyModel(surveyJson);
  survey.data = dataJson;
  let hasErrors = false;
  survey.visiblePages.forEach((p) => (hasErrors = p.hasErrors() || hasErrors));

  return !hasErrors;
};

export default {
  index,
  show,
  store,
  update,
  destroy,
};
