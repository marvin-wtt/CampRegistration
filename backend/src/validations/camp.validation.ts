import Joi, { SchemaLikeWithoutArray } from "joi";
import JoiDate from "@joi/date";
import { CountryCode } from "@/validations/custom.validation";

const extendedJoi = Joi.extend(JoiDate);

const time = () => {
  return extendedJoi.date().utc().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
};

const translatedValue = (valueType: SchemaLikeWithoutArray) => {
  return Joi.alternatives().try(
    valueType,
    Joi.object()
      .pattern(
        Joi.string().valid(Joi.ref("countries", { in: true })),
        valueType,
      )
      .min(Joi.ref("countries.length"))
      .max(Joi.ref("countries.length")),
  );
};

const show = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
};

const index = {
  query: Joi.object({
    // Filter
    name: Joi.string(),
    active: Joi.boolean(),
    public: Joi.boolean(),
    startAt: Joi.date(),
    endAt: Joi.date(),
    minAge: Joi.number(),
    maxAge: Joi.number(),
    country: Joi.string().length(2),
    // Options
    page: Joi.number(),
    limit: Joi.number(),
    sortBy: Joi.string(),
  }),
};

const store = {
  body: Joi.object({
    active: Joi.boolean().default(false),
    public: Joi.boolean().default(false),
    countries: Joi.array()
      .items(Joi.string().custom(CountryCode).lowercase())
      .min(1)
      .required(),
    name: translatedValue(Joi.string()).required(),
    organization: translatedValue(Joi.string()).required(),
    contactEmail: translatedValue(Joi.string().email()).required(),
    maxParticipants: translatedValue(Joi.number().integer().min(0)).required(),
    startAt: time().required(),
    endAt: time().min(Joi.ref("startAt")).required(),
    minAge: Joi.number().integer().min(0).max(99).required(),
    maxAge: Joi.number().integer().min(Joi.ref("minAge")).max(99).required(),
    location: translatedValue(Joi.string()).required(),
    price: Joi.number().min(0).required(),
    form: Joi.object().required(),
    themes: Joi.object().pattern(Joi.string(), Joi.object()),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
  body: Joi.object({
    // TODO If countries changes, the translated values might be required if they are translated
    // FIXME translated values will if countries field is missing
    active: Joi.boolean(),
    public: Joi.boolean(),
    countries: Joi.array()
      .items(Joi.string().custom(CountryCode).lowercase())
      .min(1),
    name: translatedValue(Joi.string()),
    organization: translatedValue(Joi.string()),
    contactEmail: translatedValue(Joi.string()),
    maxParticipants: translatedValue(Joi.number().integer().min(0)),
    startAt: Joi.date().iso(),
    endAt: Joi.date().iso().min(Joi.ref("startAt")),
    minAge: Joi.number().integer().min(0).max(99),
    maxAge: Joi.number().integer().min(Joi.ref("minAge")).max(99),
    location: translatedValue(Joi.string()),
    price: Joi.number().min(0),
    form: Joi.object(),
    themes: Joi.object().pattern(Joi.string(), Joi.object()),
  }),
};

const destroy = {
  params: Joi.object({
    campId: Joi.string().required(),
  }),
};

export default {
  show,
  index,
  store,
  update,
  destroy,
};
