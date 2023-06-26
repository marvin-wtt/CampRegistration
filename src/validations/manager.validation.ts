import Joi from "joi";

const index = {
  params: Joi.object({
    campId: Joi.string(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string(),
  }),
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string(),
    managerId: Joi.string(),
  }),
};

export default {
  index,
  store,
  destroy,
};
