import { Role } from "@prisma/client";
import Joi from "joi";
import { password } from "./custom.validation";

const show = {
  params: Joi.object({
    userId: Joi.number().integer(),
  }),
};

const index = {
  query: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const store = {
  body: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().valid(Role.USER, Role.ADMIN),
  }),
};

const update = {
  params: Joi.object({
    userId: Joi.string(),
  }),
  body: Joi.object({
    email: Joi.string().email(),
    password: Joi.string().custom(password),
    name: Joi.string(),
  }).min(1),
};

const destroy = {
  params: Joi.object({
    userId: Joi.string(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
