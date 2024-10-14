import Joi from 'joi';

const store = {
  body: Joi.object({
    message: Joi.string().required(),
    location: Joi.string(),
    userAgent: Joi.string(),
    email: Joi.string().email(),
  }),
};

export default {
  store,
};
