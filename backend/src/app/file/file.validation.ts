import Joi from 'joi';
import { ServiceFileCreateData } from '@camp-registration/common/entities';

const stream = {
  params: Joi.object({
    fileId: Joi.string().required(),
  }).unknown(),
  query: Joi.object({
    download: Joi.boolean(),
  }),
};

const show = {
  params: Joi.object({
    fileId: Joi.string().required(),
  }).unknown(),
};

const index = {
  query: Joi.object({
    page: Joi.number().integer(),
    name: Joi.string(),
    type: Joi.string(),
  }),
};

const store = {
  body: Joi.object<ServiceFileCreateData>({
    name: Joi.string(),
    field: Joi.string(),
    accessLevel: Joi.string(),
  }),
};

const destroy = {
  params: Joi.object({
    fileId: Joi.string().required(),
  }).unknown(),
};

export default {
  stream,
  show,
  index,
  store,
  destroy,
};
