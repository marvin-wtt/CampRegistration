import Joi from 'joi';
import JoiDate from '@joi/date';
import { ProgramEvent } from '@camp-registration/common/entities';

const extendedJoi = Joi.extend(JoiDate);

const translatableSchema = Joi.alternatives()
  .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
  .required();
const timeSchema = Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);
const dateSchema = extendedJoi.date().format('YYYY-MM-DD');

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
    details: translatableSchema.optional(),
    location: translatableSchema.optional(),
    date: dateSchema.optional(),
    time: timeSchema.optional(),
    duration: Joi.number().min(0).optional(),
    color: Joi.string().required(),
    side: Joi.string().optional(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
    programEventId: Joi.string().required(),
  }),
  body: Joi.object({
    title: translatableSchema.optional(),
    details: translatableSchema.optional(),
    location: translatableSchema.optional(),
    date: dateSchema.optional(),
    time: timeSchema.optional(),
    duration: Joi.number().min(0).optional(),
    color: Joi.string().optional(),
    side: Joi.string().optional(),
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
