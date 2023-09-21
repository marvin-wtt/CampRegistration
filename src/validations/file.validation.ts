import Joi from "joi";

const show = {
  params: Joi.object({
    fileId: Joi.string().required(),
  }),
};

export default {
  show,
};
