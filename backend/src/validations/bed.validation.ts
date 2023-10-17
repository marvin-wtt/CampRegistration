import Joi from "joi";

const update = {
  params: Joi.object({
    campId: Joi.string(),
    roomId: Joi.string(),
    bedId: Joi.string(),
  }),
  body: Joi.object({
    registrationId: Joi.string().allow(null),
  }),
};

export default {
  update,
};
