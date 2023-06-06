import Joi from "joi";

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
  body: Joi.object({
    // TODO Validate survey
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
    registrationId: Joi.string(),
  }),
  body: Joi.object({
    // TODO Validate survey
  }),
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
