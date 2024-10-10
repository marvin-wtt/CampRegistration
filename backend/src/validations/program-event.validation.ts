import Joi from 'joi';
import JoiDate from '@joi/date';
import { ProgramEvent } from '@camp-registration/common/entities';

const extendedJoi = Joi.extend(JoiDate);

const translatableSchema = Joi.alternatives()
  .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
  .required();
const timeSchema = Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);
const dateSchema = extendedJoi.date().format('YYYY-MM-DD').raw();

const show = {
  params: Joi.object({
    campId: Joi.string().required(),
    programEventId: Joi.string().required(),
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
  body: Joi.object<ProgramEvent>({
    title: translatableSchema.required(),
    details: translatableSchema.optional().allow(null),
    location: translatableSchema.optional().allow(null),
    date: dateSchema.optional(),
    time: timeSchema.optional().allow(null),
    duration: Joi.number().min(0).optional().allow(null),
    color: Joi.string().optional().allow(null),
    side: Joi.string().optional().allow(null),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    programEventId: Joi.string().required(),
  }),
  body: Joi.object({
    title: translatableSchema.optional(),
    details: translatableSchema.optional().allow(null),
    location: translatableSchema.optional().allow(null),
    date: dateSchema.optional(),
    time: timeSchema.optional().allow(null),
    duration: Joi.number().min(0).optional().allow(null),
    color: Joi.string().optional().allow(null),
    side: Joi.string().optional().allow(null),
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
    programEventId: Joi.string().required(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
