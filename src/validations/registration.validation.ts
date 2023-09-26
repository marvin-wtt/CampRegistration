import Joi from "joi";
import { Request } from "express";
import { routeModel } from "@/utils/verifyModel";
import { formUtils } from "@/utils/form";

export const registrationData: Joi.CustomValidator<object> = (
  value,
  helpers,
) => {
  if (typeof value !== "object" || value == null) {
    return helpers.message({ custom: "Survey may not be null" });
  }

  const req = helpers.prefs.context as Request;
  const surveyJson = routeModel(req.models.camp).form;

  const formHelper = formUtils(surveyJson);
  formHelper.updateData(value, req.files);

  if (formHelper.hasDataErrors()) {
    return helpers.message({ custom: "Invalid survey data" });
  }

  const unknownDataFields = formHelper.unknownDataFields();
  if (unknownDataFields.length > 0) {
    return helpers.message({
      custom: `Unknown fields '${unknownDataFields.join(", ")}'`,
    });
  }

  return value;
};

const index = {
  params: Joi.object({
    campId: Joi.string(),
  }),
};

const show = {
  params: Joi.object({
    campId: Joi.string().required(),
    registrationId: Joi.string().required(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
  body: Joi.object().custom(registrationData, "registration data").required(),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    registrationId: Joi.string().required(),
  }),
  body: Joi.object().required(), // TODO Validate against form or template fields
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
    registrationId: Joi.string().required(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
