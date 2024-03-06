import Joi from 'joi';

const Translated = Joi.alternatives().try(
  Joi.string(),
  Joi.object().pattern(Joi.string(), Joi.string()),
);

const show = {
  params: Joi.object({
    campId: Joi.string().required(),
    roomId: Joi.string().required(),
  }),
};

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
    name: Translated.required() ,
    capacity: Joi.number().min(1).required(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    roomId: Joi.string().required(),
  }),
  body: Joi.object({
    name: Translated,
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
    roomId: Joi.string().required(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
