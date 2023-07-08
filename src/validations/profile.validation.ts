import Joi from "joi";
import { PasswordSchema } from "./custom.validation";

const update = {
  body: Joi.object({
    email: Joi.string().email(),
    password: PasswordSchema,
    name: Joi.string(),
    locale: Joi.string().regex(/^[a-z]{2}(?:[_-][A-Z]{2})?$/g),
  }).min(1),
};

export default { update };
