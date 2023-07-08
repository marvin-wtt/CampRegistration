import Joi from "joi";
import { PasswordSchema } from "./custom.validation";

const update = {
  body: Joi.object({
    email: Joi.string().email(),
    password: PasswordSchema,
    name: Joi.string(),
  }).min(1),
};

export default { update };
