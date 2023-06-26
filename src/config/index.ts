import dotenv from "dotenv";
import path from "path";
import Joi from "joi";

// This must happen before importing the individual configs
dotenv.config({ path: path.join(process.cwd(), ".env") });

import authConfig from "./auth.config";
import emailConfig from "./email.config";
import storageOptions from "./storage.config";

const { value: envVars, error } = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test")
      .required(),
    APP_PORT: Joi.number().default(3000),
    APP_URL: Joi.string().uri(),
  })
  .unknown()
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.APP_PORT,
  origin: envVars.APP_URL,
  jwt: {
    ...authConfig,
  },
  email: {
    ...emailConfig,
  },
  storage: {
    ...storageOptions,
  },
};
