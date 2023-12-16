import Joi from 'joi';
import { Request } from 'express';
import { routeModel } from 'utils/verifyModel';
import { formUtils } from 'utils/form';

export const registrationData: Joi.CustomValidator<object> = (
  value,
  helpers,
) => {
  if (typeof value !== 'object' || value == null) {
    return helpers.message({ custom: 'Survey may not be null' });
  }

  const req = helpers.prefs.context as Request;
  const camp = routeModel(req.models.camp);

  const formHelper = formUtils(camp);
  formHelper.updateData(value, req.files);

  if (formHelper.hasDataErrors()) {
    return helpers.message({ custom: 'Invalid survey data' });
  }

  const unknownDataFields = formHelper.unknownDataFields();
  if (unknownDataFields.length > 0) {
    return helpers.message({
      custom: `Unknown fields '${unknownDataFields.join(', ')}'`,
    });
  }

  if (formHelper.hasUnknownFiles()) {
    return helpers.message({
      custom: `Too many files provided.`,
    });
  }

  return value;
};

const index = {
  params: Joi.object({
    campId: Joi.string().required(),
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
  body: Joi.object({
    data: Joi.object().custom(registrationData, 'registration data').required(),
    locale: Joi.string().regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/),
    // files
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    registrationId: Joi.string().required(),
  }),
  body: Joi.object({
    data: Joi.object().required(),
    waitingList: Joi.boolean(),
  }),
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
