import Joi from 'joi';

const store = {
  params: Joi.object({
    campId: Joi.string().required(),
    roomId: Joi.string(),
  }),
  body: Joi.object({
    registrationId: Joi.string().optional(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
    roomId: Joi.string(),
    bedId: Joi.string(),
  }),
  body: Joi.object({
    registrationId: Joi.string().allow(null),
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
    roomId: Joi.string().required(),
    bedId: Joi.string(),
  }),
};

export default {
  store,
  update,
  destroy,
};
