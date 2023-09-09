import Joi from "joi";
import { Request } from "express";
import { routeModel } from "@/utils/verifyModel";
import {hasSurveyErrors, loadSurvey} from "@/utils/surveyJs";

export const registrationData: Joi.CustomValidator<object> = (
  value,
  helpers
) => {
  if (typeof value !== "object" || value == null) {
    return helpers.message({ en: "Survey may not be null" });
  }

  const req = helpers.prefs.context as Request;
  const surveyJson = routeModel(req.models.camp).form;

  const survey = loadSurvey(surveyJson, value, req.files);
  const error = hasSurveyErrors(survey);
  if (error) {
    return helpers.message({ en: "Invalid survey data" });
  }

  // Remove additional fields not included in the survey or not visible
  const surveyFields = survey
    .getAllQuestions(true)
    .map((q) => q.valueName || q.name);
  return Object.keys(value)
    .filter((key) => surveyFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = value[key as keyof typeof value];
      return obj;
    }, {} as Record<string, object>);
};

const index = {
  params: Joi.object({
    campId: Joi.string(),
  }),
};

const show = {
  params: Joi.object({
    campId: Joi.string(),
    registrationId: Joi.string(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string(),
  }),
  body: Joi.object().custom(registrationData).required(),
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
    registrationId: Joi.string(),
  }),
  body: Joi.object().required(), // TODO Validate against form or template fields
};

const destroy = {
  params: Joi.object({
    campId: Joi.string(),
    registrationId: Joi.string(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
