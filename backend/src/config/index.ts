import { env } from '#config/enviroment';

import databaseConfig from './database.config.js';
import authConfig from './auth.config.js';
import emailConfig from './email.config.js';
import storageOptions from './storage.config.js';
import csrfConfig from './csrf.config.js';

export default {
  env: env.NODE_ENV,
  appName: env.APP_NAME,
  port: env.APP_PORT,
  origin: env.APP_URL,
  database: { ...databaseConfig },
  jwt: {
    ...authConfig,
  },
  email: {
    ...emailConfig,
  },
  storage: {
    ...storageOptions,
  },
  csrf: {
    ...csrfConfig,
  },
};
