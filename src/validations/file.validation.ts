import Joi from "joi";

const show = {
  params: Joi.object({
    fileId: Joi.string().required(),
  }).unknown(),
  query: Joi.object({
    download: Joi.boolean(),
  }),
};

const index = {
  query: Joi.object({
    page: Joi.number().integer(),
    name: Joi.string(),
    type: Joi.string(),
  }),
};

const store = {
  body: Joi.object({
    name: Joi.string().required(),
    field: Joi.string().optional(),
    accessLevel: Joi.string().optional(),
  }),
};

const destroy = {
  params: Joi.object({
    fileId: Joi.string().required(),
  }).unknown(),
};

export default {
  show,
  index,
  store,
  destroy,
};
