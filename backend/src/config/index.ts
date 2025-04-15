import { env } from '#config/enviroment';

import authConfig from './auth.config.js';
import emailConfig from './email.config.js';
import storageOptions from './storage.config.js';

export default {
  env: env.NODE_ENV,
  appName: env.APP_NAME,
  port: env.APP_PORT,
  origin: env.APP_URL,
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
