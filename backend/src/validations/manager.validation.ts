import Joi from 'joi';

const index = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
    managerId: Joi.string().required(),
  }),
};

const accept = {
  params: Joi.object({
    managerId: Joi.string().required(),
    token: Joi.string().required(),
  }),
};

export default {
  index,
  store,
  destroy,
  accept,
};
