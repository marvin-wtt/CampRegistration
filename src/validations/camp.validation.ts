import Joi from "joi";
import { type Prisma } from "@prisma/client";

const validateCampBody = Joi.object<Prisma.CampCreateInput>({
  public: Joi.boolean(),
  countries: Joi.array()
    .items(Joi.string().uppercase().length(2))
    .min(1)
    .required(),
  name: Joi.alternatives()
    .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
    .required(),
  maxParticipants: Joi.alternatives()
    .try(Joi.number(), Joi.object().pattern(Joi.string(), Joi.number()))
    .required(),
  startAt: Joi.date().iso().required(),
  endAt: Joi.date().iso().min(Joi.ref("startAt")).required(),
  minAge: Joi.number().integer().min(0).max(99).required(),
  maxAge: Joi.number().integer().min(Joi.ref("minAge")).max(99).required(),
  location: Joi.alternatives()
    .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
    .required(),
  price: Joi.string().required(),
  form: Joi.object().required(),
});

const show = {
  params: Joi.object({
    campId: Joi.string(),
  }),
};

const index = {
  // TODO Validate query parameters
};

const store = {
  body: validateCampBody,
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
  }),
  body: validateCampBody,
};

const destroy = {
  params: Joi.object({
    campId: Joi.string(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
