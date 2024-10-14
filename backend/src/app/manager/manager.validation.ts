import Joi from 'joi';
import {
  CampManagerCreateData,
  CampManagerUpdateData,
} from '@camp-registration/common/entities';

const index = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
};

const store = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
  body: Joi.object<CampManagerCreateData>({
    email: Joi.string().email().required(),
    role: Joi.string(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    managerId: Joi.string().required(),
  }),
  body: Joi.object<CampManagerUpdateData>({
    role: Joi.string(),
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
  update,
  destroy,
  accept,
};
