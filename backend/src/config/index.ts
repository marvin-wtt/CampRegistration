import dotenv from 'dotenv';
import { z } from 'zod';
import { validateEnv } from 'core/validation/env';

// This must happen before importing the individual configs
dotenv.config();

import authConfig from './auth.config';
import emailConfig from './email.config';
import storageOptions from './storage.config';

const MainEnvSchema = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']),
    APP_PORT: z.coerce
      .number()
      .min(0)
      .max(65535)
      .describe('The port on which is app listens')
      .default(8000),
    APP_URL: z.string().url().describe('URL, where the app is hosted.'),
    APP_NAME: z.string().readonly().describe('The name of the app.'),
  })
  .readonly();

const envVars = validateEnv(MainEnvSchema);

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
