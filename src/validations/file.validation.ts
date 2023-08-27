import Joi from "joi";

const show = {
  params: Joi.object({
    file: Joi.string(),
  }),
};

export default {
  show,
};
