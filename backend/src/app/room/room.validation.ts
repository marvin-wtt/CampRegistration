import Joi from 'joi';
import {
  RoomCreateData,
  RoomUpdateData,
} from '@camp-registration/common/entities';

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
  body: Joi.object<RoomCreateData>({
    name: Translated.required(),
    capacity: Joi.number().min(1).default(0),
    order: Joi.number().optional(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    roomId: Joi.string().required(),
  }),
  body: Joi.object<RoomUpdateData>({
    name: Translated.optional(),
    order: Joi.number().optional(),
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
