import { Role } from '@prisma/client';
import Joi from 'joi';
import { PasswordSchema } from './custom.validation';

const show = {
  params: Joi.object({
    userId: Joi.number().integer().required(),
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
    password: PasswordSchema,
    name: Joi.string().required(),
    role: Joi.string().valid(Role.USER, Role.ADMIN),
    locale: Joi.string().regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/),
  }),
};

const update = {
  params: Joi.object({
    userId: Joi.string().required(),
  }),
  body: Joi.object({
    email: Joi.string().email(),
    password: PasswordSchema,
    name: Joi.string(),
    locale: Joi.string().regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/),
    locked: Joi.boolean(),
    emailVerified: Joi.boolean(),
  }).min(1),
};

const destroy = {
  params: Joi.object({
    userId: Joi.string().required(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
