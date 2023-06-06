import Joi from "joi";
import { password } from "./custom.validation";

const update = {
  body: Joi.object({
    email: Joi.string().email(),
    password: Joi.string().custom(password),
    name: Joi.string(),
  }).min(1),
};

export default { update };
