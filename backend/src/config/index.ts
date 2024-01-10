import dotenv from 'dotenv';
import Joi from 'joi';

// This must happen before importing the individual configs
dotenv.config();

import authConfig from './auth.config';
import emailConfig from './email.config';
import storageOptions from './storage.config';

const { value: envVars, error } = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required(),
    APP_PORT: Joi.number().min(0).max(65535).default(8000),
    APP_URL: Joi.string().uri().required(),
    APP_NAME: Joi.string().required().description('The name of the app.'),
  })
  .unknown()
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  appName: envVars.APP_NAME,
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
