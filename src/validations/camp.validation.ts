import Joi from "joi";

const show = {
  params: Joi.object({
    campId: Joi.string(),
  }),
};

const index = {
  query: Joi.object({
    // Filter
    name: Joi.string(),
    private: Joi.boolean(),
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
    public: Joi.boolean().default(false),
    countries: Joi.array()
      .items(Joi.string().lowercase().length(2))
      .min(1)
      .required(),
    name: Joi.alternatives()
      .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
      .required(),
    // TODO This should be an exact match
    max_participants: Joi.alternatives()
      .try(Joi.number(), Joi.object().pattern(Joi.string(), Joi.number()))
      .required(),
    start_at: Joi.date().iso().required(),
    end_at: Joi.date().iso().min(Joi.ref("start_at")).required(),
    min_age: Joi.number().integer().min(0).max(99).required(),
    max_age: Joi.number().integer().min(Joi.ref("min_age")).max(99).required(),
    location: Joi.alternatives()
      .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string()))
      .required(),
    price: Joi.number().min(0).required(),
    form: Joi.object().required(),
  }),
};

const update = {
  params: Joi.object({
    campId: Joi.string(),
  }),
  body: Joi.object({
    public: Joi.boolean(),
    countries: Joi.array()
      .items(Joi.string().lowercase().length(2))
      .min(1),
    name: Joi.alternatives()
      .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string())),
    max_participants: Joi.alternatives()
      .try(Joi.number(), Joi.object().pattern(Joi.string(), Joi.number())),
    start_at: Joi.date().iso(),
    end_at: Joi.date().iso().min(Joi.ref("start_at")),
    min_age: Joi.number().integer().min(0).max(99),
    max_age: Joi.number().integer().min(Joi.ref("min_age")).max(99),
    location: Joi.alternatives()
      .try(Joi.string(), Joi.object().pattern(Joi.string(), Joi.string())),
    price: Joi.number().min(0),
    form: Joi.object(),
  }),
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
