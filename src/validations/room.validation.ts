import Joi from "joi";

const show = {
  params: Joi.object({
    campId: Joi.string(),
    roomId: Joi.string(),
  }),
};

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
    name: Joi.string().required(),
    capacity: Joi.number().min(1).required(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
    roomId: Joi.string(),
  }),
  body: Joi.object({
    name: Joi.alternatives().try(
      Joi.string(),
      Joi.object().pattern(Joi.string(), Joi.string())
    ),
    capacity: Joi.number().min(1),
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string(),
    roomId: Joi.alternatives().try(
      Joi.string(),
      Joi.object().pattern(Joi.string(), Joi.string())
    ),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
