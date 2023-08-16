import Joi from "joi";
import { Request } from "express";
import { SurveyModel } from "survey-core";
import { routeModel } from "@/utils/verifyModel";

const fileFields = (req: Request) => {
  const mapFileToSurveyData = (file: Express.Multer.File) => {
    return {
      type: file.mimetype,
      name: file.originalname,
      content: file.originalname,
    };
  };

  if (req.file) {
    return {
      [req.file.fieldname]: mapFileToSurveyData(req.file),
    };
  }

  if (!req.files) {
    return {};
  }

  if (Array.isArray(req.files)) {
    return req.files.reduce((acc, file) => {
      acc[file.fieldname] = mapFileToSurveyData(file);
      return acc;
    }, {} as Record<string, object>);
  }

  const requestFiles = req.files;
  return Object.keys(requestFiles).reduce((acc, key) => {
    const files = requestFiles[key];
    acc[key] = files.map((file) => mapFileToSurveyData(file));
    return acc;
  }, {} as Record<string, object>);
};

export const registrationData: Joi.CustomValidator<object> = (
  value,
  helpers
) => {
  if (typeof value !== "object" || value == null) {
    return helpers.message({ en: "Survey may not be null" });
  }

  const req = helpers.prefs.context as Request;
  const surveyJson = routeModel(req.models.camp).form;
  const survey = new SurveyModel(surveyJson);
  survey.data = { ...value, ...fileFields(req) };

  const error = survey.pages.some((p) => p.hasErrors());
  if (error) {
    return helpers.message({ en: "Invalid survey data" });
  }

  // Remove additional fields not included in the survey or not visible
  const surveyFields = survey.getAllQuestions(true).map((q) => q.name);
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
